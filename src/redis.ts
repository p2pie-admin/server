// redis-store.ts
import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";
dotenv.config();

type RedisValue = string | number | object;
const DEFAULT_TTL_SECONDS = 1000;

type LogLevel = "error" | "success" | "warning" | "important" | "info";
const log = (message: string, level: LogLevel = "info") => {
  const colors: Record<LogLevel, string> = {
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
const host =
  env === "production"
    ? process.env.PROD_REDIS_HOST
    : process.env.DEV_REDIS_HOST;

// ——— single DB / single client ———
const db: RedisClientType = createClient({
  url: `redis://${host}:${port}/0`,
  socket: {
    reconnectStrategy: (retries) => {
      log(`Redis reconnect attempt ${retries}`, "info");
      return Math.min(retries * 100, 30_000);
    },
  },
}) as RedisClientType;

let shuttingDown = false;
let pendingOperations = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const trackOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  pendingOperations++;
  try {
    return await operation();
  } finally {
    pendingOperations--;
  }
};

db.on("connect", () => {
  log(`Redis connected at redis://${host}:${port}/0`, "info");
});
db.on("error", (err) => {
  if (shuttingDown && err?.code === "ECONNRESET") return;
  log(`Redis error: ${err.message}`, "error");
});
db.on("reconnecting", () => {
  log(`Redis reconnecting...`, "warning");
});

export async function initializeRedis() {
  if (!db.isOpen) await db.connect();
}

// автоинициализацию можно убрать, если хотите вызывать initializeRedis вручную
initializeRedis();

/* ================= helpers ================= */

const toJSONString = (v: any): string =>
  v === undefined
    ? "null"
    : typeof v === "string"
    ? v
    : typeof v === "number"
    ? String(v)
    : v === null
    ? "null"
    : JSON.stringify(v);

const tryParseJSON = (v: string) => {
  if (v === "null") return null;
  try {
    return JSON.parse(v);
  } catch {
    return v; // не JSON — вернём как строку
  }
};

// Неблокирующий сбор ключей по паттерну через SCAN
async function scanKeys(pattern: string, count = 500): Promise<string[]> {
  const found: string[] = [];
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
export async function setObject(
  key: string,
  object: Record<string, any>,
  expireIn?: number
) {
  try {
    if (shuttingDown) return;
    if (!object || typeof object !== "object") {
      console.error("setObject: 'object' must be a plain object");
      return;
    }

    await trackOperation(async () => {
      const multi = db.multi();
      const ttl =
        expireIn === undefined || expireIn === null
          ? DEFAULT_TTL_SECONDS
          : expireIn;
      const shouldExpire = ttl > 0;

      for (const [subKey, val] of Object.entries(object)) {
        const fullKey = `${key}:${subKey}`;
        const strVal = toJSONString(val);

        if (shouldExpire) {
          multi.set(fullKey, strVal, { EX: ttl });
        } else {
          multi.set(fullKey, strVal);
        }
      }

      const rootValue = toJSONString(object);
      if (shouldExpire) {
        multi.set(key, rootValue, { EX: ttl });
      } else {
        multi.set(key, rootValue);
      }

      await multi.exec();
    });
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return;
    console.error(`Error in setObject:`, error);
  }
}

/* ================= 2) setData =================
 * Универсальная запись ключ:значение как строку.
 * Использование: setData("some_key", data, expireIn?).
 * По умолчанию expireIn=1000. Передайте 0, чтобы записать без истечения.
 */
export const setData = async (
  key: string,
  value: RedisValue,
  expireIn?: number // seconds
) => {
  try {
    if (shuttingDown) return;
    await trackOperation(async () => {
      const strValue = toJSONString(value);
      const ttl =
        expireIn === undefined || expireIn === null
          ? DEFAULT_TTL_SECONDS
          : expireIn;

      if (ttl > 0) {
        await db.set(key, strValue, { EX: ttl });
      } else {
        await db.set(key, strValue);
      }
    });
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return;
    console.error(`Error in setData:`, error);
  }
};

/* ================= 3) getObject / getData =================
 * getObject:
 *  - если key вида "exchangers:123" — вернёт один элемент (JSON.parse)
 *  - если key = "exchangers" — вернёт всю коллекцию как объект { "123": val, "456": val, ... }
 * getData:
 *  - читает произвольный ключ строкой и пытается распарсить JSON
 */

export async function getObject(key: string): Promise<object | null> {
  try {
    const snapshot = await db.get(key);
    if (snapshot !== null) {
      return tryParseJSON(snapshot) as object;
    }

    // соберём ключи вида key:* чтобы восстановить объект
    const keys = await scanKeys(`${key}:*`);
    if (keys.length === 0) return null;

    const result: Record<string, any> = {};
    const chunkSize = 500;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const batch = keys.slice(i, i + chunkSize);
      const values = await db.mGet(batch);

      for (let j = 0; j < batch.length; j++) {
        const fullKey = batch[j];
        const raw = values[j];
        if (raw === null) continue;
        const subKey = fullKey.slice(key.length + 1);
        const parts = subKey.split(":").filter(Boolean);

        let node: Record<string, any> = result;
        for (let k = 0; k < parts.length; k++) {
          const segment = parts[k];
          if (k === parts.length - 1) {
            node[segment] = tryParseJSON(raw);
          } else {
            node[segment] = node[segment] ?? {};
            node = node[segment];
          }
        }
      }
    }
    return result;
  } catch (error) {
    console.error(`Error in getObject:`, error);
    return null;
  }
}

export async function getData(key: string) {
  try {
    const value = await db.get(key);
    if (value === null) return null;
    return tryParseJSON(value);
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return null;
    console.error(`Error in getData:`, error);
    return null;
  }
}

export async function getKeys(pattern = "*"): Promise<string[]> {
  try {
    const keys = await scanKeys(pattern);
    const rootKeys = new Set<string>();

    keys.forEach((key) => {
      const root = key.includes(":") ? key.split(":")[0] : key;
      rootKeys.add(root);
    });

    return Array.from(rootKeys).sort();
  } catch (error) {
    console.error(`Error in getKeys:`, error);
    return [];
  }
}

/* ================= lists (history series) =================
 * pushListJSON: append a JSON point to a capped list (oldest entries are dropped).
 * getListJSON: read the newest `count` points (oldest first).
 */
export const pushListJSON = async (
  key: string,
  value: RedisValue,
  maxLen: number
) => {
  try {
    if (shuttingDown) return;
    await trackOperation(async () => {
      const multi = db.multi();
      multi.rPush(key, toJSONString(value));
      if (maxLen > 0) multi.lTrim(key, -maxLen, -1);
      await multi.exec();
    });
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return;
    console.error(`Error in pushListJSON:`, error);
  }
};

export const getListJSON = async <T = unknown>(
  key: string,
  count: number
): Promise<T[]> => {
  try {
    const raw = await db.lRange(key, count > 0 ? -count : 0, -1);
    return raw.map((item) => tryParseJSON(item) as T);
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return [];
    console.error(`Error in getListJSON:`, error);
    return [];
  }
};

export function getFirstObjectEntry<T = unknown>(value: unknown): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, T>;
  for (const key of Object.keys(record)) {
    return record[key];
  }
  return null;
}

/* ================ shutdown ================ */
const waitForPendingOperations = async (timeoutMs = 7000) => {
  const start = Date.now();
  while (pendingOperations > 0 && Date.now() - start < timeoutMs) {
    await sleep(50);
  }
  if (pendingOperations > 0) {
    log(
      `Redis shutdown proceeded with ${pendingOperations} pending operations`,
      "warning"
    );
  }
};

const handleShutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await waitForPendingOperations();
    if (db.isOpen) await db.quit();
    console.log("Redis connection closed");
  } catch (error) {
    console.error("Error while closing Redis connection", error);
  } finally {
    process.exit(0);
  }
};

process.once("SIGINT", handleShutdown);
process.once("SIGTERM", handleShutdown);
