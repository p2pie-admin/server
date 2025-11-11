"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirstObjectEntry = exports.getKeys = exports.getData = exports.getObject = exports.setData = exports.setObject = exports.initializeRedis = void 0;
// redis-store.ts
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
dotenv_1.default.config();
const DEFAULT_TTL_SECONDS = 1000;
const log = (message, level = "info") => {
    const colors = {
        error: "📕 \u001b[1;31m",
        success: "📗 \u001b[1;32m",
        warning: "📙 \u001b[1;33m",
        info: "📘 \u001b[1;34m",
        important: "📔 \u001b[38;5;226m",
    };
    console.log(`${colors[level]} ${message}`);
};
const env = process.env.NODE_ENV || "development";
const port = process.env.REDIS_PORT || "6379";
const host = env === "production"
    ? process.env.PROD_REDIS_HOST
    : process.env.DEV_REDIS_HOST;
// ——— single DB / single client ———
const db = (0, redis_1.createClient)({
    url: `redis://${host}:${port}/0`,
    socket: {
        reconnectStrategy: (retries) => {
            log(`Redis reconnect attempt ${retries}`, "info");
            return Math.min(retries * 100, 30000);
        },
    },
});
let shuttingDown = false;
let pendingOperations = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const trackOperation = async (operation) => {
    pendingOperations++;
    try {
        return await operation();
    }
    finally {
        pendingOperations--;
    }
};
db.on("connect", () => {
    log(`Redis connected at redis://${host}:${port}/0`, "info");
});
db.on("error", (err) => {
    if (shuttingDown && err?.code === "ECONNRESET")
        return;
    log(`Redis error: ${err.message}`, "error");
});
db.on("reconnecting", () => {
    log(`Redis reconnecting...`, "warning");
});
async function initializeRedis() {
    if (!db.isOpen)
        await db.connect();
}
exports.initializeRedis = initializeRedis;
// автоинициализацию можно убрать, если хотите вызывать initializeRedis вручную
initializeRedis();
/* ================= helpers ================= */
const toJSONString = (v) => v === undefined
    ? "null"
    : typeof v === "string"
        ? v
        : typeof v === "number"
            ? String(v)
            : v === null
                ? "null"
                : JSON.stringify(v);
const tryParseJSON = (v) => {
    if (v === "null")
        return null;
    try {
        return JSON.parse(v);
    }
    catch {
        return v; // не JSON — вернём как строку
    }
};
// Неблокирующий сбор ключей по паттерну через SCAN
async function scanKeys(pattern, count = 500) {
    const found = [];
    for await (const key of db.scanIterator({ MATCH: pattern, COUNT: count })) {
        found.push(key);
    }
    return found;
}
/* ================= 1) setObject =================
 * Записывает "коллекцию" и раскидывает её на один уровень по ключам:
 *  setObject("exchangers", { "123": {...}, "456": {...} })
 *  создаст:
 *   - exchangers:123 -> JSON(value)
 *   - exchangers:456 -> JSON(value)
 * Параметры:
 *  - expireIn (default: 1000) — TTL сек на каждый созданный ключ
 */
async function setObject(key, object, expireIn) {
    try {
        if (shuttingDown)
            return;
        if (!object || typeof object !== "object") {
            console.error("setObject: 'object' must be a plain object");
            return;
        }
        await trackOperation(async () => {
            const multi = db.multi();
            const ttl = expireIn === undefined || expireIn === null
                ? DEFAULT_TTL_SECONDS
                : expireIn;
            const shouldExpire = ttl > 0;
            for (const [subKey, val] of Object.entries(object)) {
                const fullKey = `${key}:${subKey}`;
                const strVal = toJSONString(val);
                if (shouldExpire) {
                    multi.set(fullKey, strVal, { EX: ttl });
                }
                else {
                    multi.set(fullKey, strVal);
                }
            }
            const rootValue = toJSONString(object);
            if (shouldExpire) {
                multi.set(key, rootValue, { EX: ttl });
            }
            else {
                multi.set(key, rootValue);
            }
            await multi.exec();
        });
    }
    catch (error) {
        if (shuttingDown && error?.code === "ECONNRESET")
            return;
        console.error(`Error in setObject:`, error);
    }
}
exports.setObject = setObject;
/* ================= 2) setData =================
 * Универсальная запись ключ:значение как строку.
 * Использование: setData("some_key", data, expireIn?).
 * По умолчанию expireIn=1000. Передайте 0, чтобы записать без истечения.
 */
const setData = async (key, value, expireIn // seconds
) => {
    try {
        if (shuttingDown)
            return;
        await trackOperation(async () => {
            const strValue = toJSONString(value);
            const ttl = expireIn === undefined || expireIn === null
                ? DEFAULT_TTL_SECONDS
                : expireIn;
            if (ttl > 0) {
                await db.set(key, strValue, { EX: ttl });
            }
            else {
                await db.set(key, strValue);
            }
        });
    }
    catch (error) {
        if (shuttingDown && error?.code === "ECONNRESET")
            return;
        console.error(`Error in setData:`, error);
    }
};
exports.setData = setData;
/* ================= 3) getObject / getData =================
 * getObject:
 *  - если key вида "exchangers:123" — вернёт один элемент (JSON.parse)
 *  - если key = "exchangers" — вернёт всю коллекцию как объект { "123": val, "456": val, ... }
 * getData:
 *  - читает произвольный ключ строкой и пытается распарсить JSON
 */
async function getObject(key) {
    try {
        const snapshot = await db.get(key);
        if (snapshot !== null) {
            return tryParseJSON(snapshot);
        }
        // соберём ключи вида key:* чтобы восстановить объект
        const keys = await scanKeys(`${key}:*`);
        if (keys.length === 0)
            return null;
        const result = {};
        const chunkSize = 500;
        for (let i = 0; i < keys.length; i += chunkSize) {
            const batch = keys.slice(i, i + chunkSize);
            const values = await db.mGet(batch);
            for (let j = 0; j < batch.length; j++) {
                const fullKey = batch[j];
                const raw = values[j];
                if (raw === null)
                    continue;
                const subKey = fullKey.slice(key.length + 1);
                const parts = subKey.split(":").filter(Boolean);
                let node = result;
                for (let k = 0; k < parts.length; k++) {
                    const segment = parts[k];
                    if (k === parts.length - 1) {
                        node[segment] = tryParseJSON(raw);
                    }
                    else {
                        node[segment] = node[segment] ?? {};
                        node = node[segment];
                    }
                }
            }
        }
        return result;
    }
    catch (error) {
        console.error(`Error in getObject:`, error);
        return null;
    }
}
exports.getObject = getObject;
async function getData(key) {
    try {
        const value = await db.get(key);
        if (value === null)
            return null;
        return tryParseJSON(value);
    }
    catch (error) {
        if (shuttingDown && error?.code === "ECONNRESET")
            return null;
        console.error(`Error in getData:`, error);
        return null;
    }
}
exports.getData = getData;
async function getKeys(pattern = "*") {
    try {
        const keys = await scanKeys(pattern);
        const rootKeys = new Set();
        keys.forEach((key) => {
            const root = key.includes(":") ? key.split(":")[0] : key;
            rootKeys.add(root);
        });
        return Array.from(rootKeys).sort();
    }
    catch (error) {
        console.error(`Error in getKeys:`, error);
        return [];
    }
}
exports.getKeys = getKeys;
function getFirstObjectEntry(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return null;
    const record = value;
    for (const key of Object.keys(record)) {
        return record[key];
    }
    return null;
}
exports.getFirstObjectEntry = getFirstObjectEntry;
/* ================ shutdown ================ */
const waitForPendingOperations = async (timeoutMs = 7000) => {
    const start = Date.now();
    while (pendingOperations > 0 && Date.now() - start < timeoutMs) {
        await sleep(50);
    }
    if (pendingOperations > 0) {
        log(`Redis shutdown proceeded with ${pendingOperations} pending operations`, "warning");
    }
};
const handleShutdown = async () => {
    if (shuttingDown)
        return;
    shuttingDown = true;
    try {
        await waitForPendingOperations();
        if (db.isOpen)
            await db.quit();
        console.log("Redis connection closed");
    }
    catch (error) {
        console.error("Error while closing Redis connection", error);
    }
    finally {
        process.exit(0);
    }
};
process.once("SIGINT", handleShutdown);
process.once("SIGTERM", handleShutdown);
