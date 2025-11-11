"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const graphql_request_1 = require("graphql-request");
const redis_1 = require("./redis");
const path_1 = __importDefault(require("path"));
const static_1 = __importDefault(require("@fastify/static"));
const helper_1 = require("./helper");
const callStrapi_1 = __importDefault(require("./services/callStrapi"));
const queries_1 = require("./services/queries");
const possiblePairs_1 = __importDefault(require("./possiblePairs"));
const manyRates_1 = require("./manyRates");
const cryptoToCurrency_1 = require("./manyRates/cryptoToCurrency");
const gpt_1 = require("./services/gpt");
dotenv_1.default.config();
exports.cache = new Map(); // In-memory cache
const server = (0, fastify_1.default)({
    logger: true,
});
server.register(static_1.default, {
    root: path_1.default.join(__dirname, "../public"), // Path to your public directory
    prefix: "/", // Optional: serve under a specific prefix
});
server.get("/", (_, reply) => {
    reply.sendFile("index.html"); // Automatically serve index.html
});
server.get("/example", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const keys = await (0, redis_1.getKeys)();
    const exampleData = await Promise.all(keys.map(async (key) => {
        const value = await (0, redis_1.getObject)(key);
        let sample;
        if (Array.isArray(value)) {
            sample = value[0]; // first item from array
        }
        else if (value && typeof value === "object") {
            sample = (0, redis_1.getFirstObjectEntry)(value);
        }
        else {
            sample = value; // fallback for string, number, etc.
        }
        return { key, sample };
    }));
    reply.send(exampleData);
});
const REVIEW_TYPES = [
    "positive",
    "neutral",
    "negative",
    "question",
];
const DEFAULT_REVIEW_TYPE = "question";
const pickString = (value) => typeof value === "string" && value.trim().length ? value.trim() : undefined;
const isValidGptResponse = (payload) => {
    if (!payload || typeof payload !== "object")
        return false;
    const data = payload;
    return (typeof data.isApproved === "boolean" &&
        typeof data.comment === "string" &&
        typeof data.tone === "string");
};
const parseGptResponse = (payload) => {
    if (!payload)
        return null;
    if (typeof payload === "string") {
        try {
            const parsed = JSON.parse(payload);
            return isValidGptResponse(parsed) ? parsed : null;
        }
        catch {
            return null;
        }
    }
    return isValidGptResponse(payload) ? payload : null;
};
const buildReviewInput = (raw) => {
    const text = pickString(raw.text);
    const exchangerId = pickString(raw.exchangerId);
    const fingerprint = pickString(raw.fingerprint);
    if (!text || !exchangerId || !fingerprint) {
        return { error: "Text, exchanger, and fingerprint are required" };
    }
    const payload = {
        text,
        exchanger: exchangerId,
        fingerprint,
        type: raw.type && REVIEW_TYPES.includes(raw.type)
            ? raw.type
            : DEFAULT_REVIEW_TYPE,
    };
    if (typeof raw.isDispute === "boolean" || raw.isDispute === null) {
        payload.isDispute = raw.isDispute;
    }
    const userAgent = pickString(raw.userAgent);
    if (userAgent)
        payload.userAgent = userAgent;
    const location = pickString(raw.location);
    if (location)
        payload.location = location;
    const honeypot = pickString(raw.honeypot);
    if (honeypot)
        payload.honeypot = honeypot;
    return { data: payload };
};
server.post("/createReview", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const review = request.body;
    server.log.info({ review }, "Received /createReview payload");
    const honeypotValue = pickString(review.honeypot);
    if (honeypotValue) {
        server.log.warn({ honeypot: honeypotValue, fingerprint: review.fingerprint }, "Honeypot triggered, skipping review creation");
        return reply.send({ status: "ok" });
    }
    const { data: reviewInput, error } = buildReviewInput(review);
    if (!reviewInput) {
        reply.status(400).send({
            status: "error",
            message: error ?? "Invalid review payload",
        });
        return;
    }
    const forwardedFor = pickString(request.headers["x-forwarded-for"]);
    if (forwardedFor) {
        reviewInput.ipAddress = forwardedFor.split(",")[0]?.trim();
    }
    else if (request.ip) {
        reviewInput.ipAddress = request.ip;
    }
    const reviewExists = async (fingerprint) => {
        try {
            const existing = await (0, callStrapi_1.default)(queries_1.ReviewByFingerprintQuery, {
                fingerprint,
            });
            const reviews = existing?.reviews;
            return Array.isArray(reviews) && reviews.length > 0;
        }
        catch (err) {
            server.log.warn({ err, fingerprint }, "Failed to check review duplicates, skipping duplicate guard");
            return false;
        }
    };
    try {
        if (reviewInput.fingerprint &&
            (await reviewExists(reviewInput.fingerprint))) {
            (0, helper_1.mylog)(`Review with fingerprint ${reviewInput.fingerprint} already exists, skipping creation`, "warning");
            return reply.send({ status: "ok" });
        }
        const prompt = await (0, gpt_1.findPrompt)("review");
        if (!prompt) {
            throw new Error("no prompt found for review");
        }
        (0, helper_1.mylog)("Prompt found", "success");
        const rawGptResponse = await (0, gpt_1.callGPT)(`${prompt} | Review text: ${reviewInput.text}`, `[${reviewInput.exchanger} review]`);
        const gptResponse = parseGptResponse(rawGptResponse);
        if (!gptResponse) {
            (0, helper_1.mylog)("GPT response could not be parsed as JSON, proceeding without moderation data", "warning");
        }
        else if (!gptResponse.isApproved) {
            (0, helper_1.mylog)(`not approved: ${JSON.stringify(gptResponse)}`, "warning");
            return reply.send({ status: "ok" });
        }
        (0, helper_1.mylog)(`${JSON.stringify(gptResponse, undefined, 4)}`, "important");
        const strapiResponse = await (0, callStrapi_1.default)(queries_1.CreateReviewMutation, {
            data: reviewInput,
        });
        const createdReview = strapiResponse?.createReview;
        if (!createdReview?.id) {
            throw new Error("createReview mutation returned empty payload");
        }
        (0, helper_1.mylog)(`Review created ${createdReview.id}`, "success");
        reply.send({
            status: "ok",
            data: { id: createdReview.id },
        });
    }
    catch (err) {
        server.log.error(err, "Failed to create review");
        if (err instanceof graphql_request_1.ClientError) {
            const graphError = err.response?.errors?.[0];
            const code = graphError?.extensions?.code;
            const message = graphError?.message || err.message || "Failed to create review";
            const statusCode = code === "BAD_USER_INPUT" ? 400 : 502;
            reply.status(statusCode).send({
                status: "error",
                message,
                code,
            });
            return;
        }
        reply.status(502).send({
            status: "error",
            message: "Failed to create review",
        });
    }
});
server.options("/createReview", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    reply.status(204).send();
});
server.post("/createReply", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    console.log("Received /createReply payload:", request.body);
    reply.send({ status: "ok" });
});
server.options("/createReply", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    reply.status(204).send();
});
const getCitySelector = async (dir) => {
    return (0, helper_1.toCache)({
        key: `city_selector:${dir ?? "all"}`,
        ttl: 2 * 60 * 60 * 1000,
        getData: async () => {
            const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
            const allDirtyRates = (await (0, redis_1.getObject)("allDirtyRates"));
            return (0, helper_1.convertCitiesToSelector)(dir, cities, allDirtyRates);
        },
    });
};
server.get("/dir=:code/:type/:city?", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const params = request.params;
    const code = params.code.toUpperCase();
    const city = params.city?.toLowerCase();
    const type = params.type;
    //const rates = await getData("allDirtyRates:ACRUB_AVAX:1200");
    const rates = await (0, helper_1.toCache)({
        key: `rates_${code}_${city || "no-city"}_${type}`,
        ttl: 30 * 1000,
        getData: async () => {
            const cleanDirRates = await (0, helper_1.getCleanDirRates)(code);
            if (!cleanDirRates)
                return [];
            const newRates = Object.values(cleanDirRates);
            if (!city) {
                return newRates;
            }
            const cityKey = city.toLowerCase();
            return newRates.reduce((res, rate) => {
                const cityRateEntry = rate.cityRates?.[cityKey];
                if (!cityRateEntry)
                    return res;
                const cityRateData = typeof cityRateEntry === "object" && cityRateEntry !== null
                    ? cityRateEntry
                    : undefined;
                const normalizedEntry = cityRateData && "rate" in cityRateData && cityRateData.rate
                    ? { ...cityRateData }
                    : { rate: cityRateEntry };
                const sanitizedRate = {
                    ...rate,
                    cityRates: {
                        [cityKey]: normalizedEntry,
                    },
                };
                return [...res, sanitizedRate];
            }, []);
        },
    });
    reply.send(JSON.stringify(rates));
});
server.get("/top_codes", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const topCodes = await (0, redis_1.getData)("top_codes");
    return reply.send(topCodes);
});
server.get("/all_pm_codes_that_exist", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const all_pm_codes_that_exist = await (0, redis_1.getData)("all_pm_codes_that_exist");
    return reply.send(all_pm_codes_that_exist);
});
server.get("/alternative_pm_codes", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const alternative_pm_codes = await (0, redis_1.getData)("alternative_pm_codes");
    return reply.send(JSON.stringify(alternative_pm_codes));
});
server.get("/parser_setting", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const parserSetting = (await (0, redis_1.getData)("parser_setting"));
    return reply.send(JSON.stringify(parserSetting));
});
server.get("/exchangers", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const exchangers = await (0, redis_1.getObject)("exchangers");
    reply.send(JSON.stringify(exchangers && Object.keys(exchangers).length
        ? exchangers
        : "no active exchangers!"));
});
server.get("/exchanger=:idOrName", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { idOrName } = request.params;
    const exchangers = (await (0, redis_1.getObject)("exchangers"));
    reply.send(JSON.stringify(exchangers && Object.keys(exchangers).length
        ? exchangers[idOrName] ||
            Object.values(exchangers).find((e) => e.name.toLocaleLowerCase() === idOrName.toLocaleLowerCase()) ||
            {}
        : "no exchangers exist"));
});
server.get("/errors", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.send(JSON.stringify(await (0, redis_1.getData)("errors")));
});
server.get("/exchanger_stats", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const stats = await (0, redis_1.getObject)("exchanger_stats");
    reply.send(JSON.stringify(stats));
});
server.get("/stats", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const workerStats = await (0, redis_1.getObject)("stats");
    reply.send(JSON.stringify(workerStats));
});
server.get("/stats/memory_usage", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const memoryUsage = await (0, redis_1.getData)("stats:memory_usage");
    reply.send(JSON.stringify(memoryUsage));
});
server.get("/city_selector", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const citySelector = await getCitySelector();
    reply.send(JSON.stringify(citySelector));
});
server.get("/city_selector=:dir", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { dir } = request.params;
    const citySelector = await getCitySelector(dir);
    reply.send(JSON.stringify(citySelector));
});
server.get("/cities", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
    reply.send(JSON.stringify(cities));
});
server.get("/non_empty_cities", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
    if (!cities)
        reply.send(null);
    const allDirtyRates = (await (0, redis_1.getObject)("allDirtyRates"));
    const nonEmpty = cities?.reduce((res, city) => {
        const dirRatesTotal = Object.entries(allDirtyRates).reduce((res, [dir, dirRates]) => {
            const totalByCity = Object.values(dirRates).filter((r) => r.cityRates &&
                Object.keys(r.cityRates).find((cen) => cen.toLowerCase() == city?.en_name.toLowerCase())).length;
            return totalByCity ? { ...res, [dir]: totalByCity } : res;
        }, {});
        return Object.keys(dirRatesTotal).length
            ? { ...res, [city.en_name.toLowerCase()]: dirRatesTotal }
            : res;
    }, {});
    reply.send(JSON.stringify(nonEmpty));
});
server.get("/city=:name", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { name } = request.params;
    const cities = (await (0, redis_1.getData)("parser_setting"))?.cities;
    if (!cities)
        reply.send(null);
    reply.send(JSON.stringify(cities?.find((c) => c.en_name.toLowerCase() == name.toLowerCase())));
});
server.get("/dirs", async (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const dirs = await (0, helper_1.toCache)({
        key: "dirs",
        getData: async () => {
            const allDirtyRates = (await (0, redis_1.getObject)("allDirtyRates"));
            const totalRatesByDir = Object.entries(allDirtyRates).reduce((res, [code, dirRate]) => {
                res = { ...res, [code]: Object.keys(dirRate).length };
                return res;
            }, {});
            const sortedArray = Object.entries(totalRatesByDir)
                .filter(([, value]) => value > Number(process.env.DIR_RATES_MIN || "3"))
                .sort(([, valueA], [, valueB]) => valueA - valueB)
                .reverse();
            return Object.fromEntries(sortedArray);
        },
    });
    reply.send(JSON.stringify(dirs));
});
server.get("/possible_pairs/:side/:code", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const param = request.params;
    const code = param.code.toUpperCase();
    const side = param.side;
    //const possiblePairs = await getPossiblePairs({ side });
    const possiblePairs = await (0, helper_1.toCache)({
        key: `possible_pairs_${side}_${code}`,
        ttl: 600 * 1000,
        getData: async () => (0, possiblePairs_1.default)({ side, code }),
    });
    // if (!code) return reply.send(JSON.stringify(possiblePairs));
    return reply.send(JSON.stringify(possiblePairs));
});
server.get("/similar/dirs=:dirsString", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { dirsString } = request.params;
    const dirs = dirsString.split(",");
    if (!dirs || !dirs.length) {
        reply.send("wrong dirs, try /similar/dirs=BTC_SBERRUB,BTC_TCSBRUB");
        return;
    }
    reply.send(JSON.stringify(await (0, manyRates_1.getSimilarRates)(dirs)));
});
server.get("/top", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const bestRates = await (0, helper_1.toCache)({
        key: "top",
        ttl: 60 * 1000,
        getData: async () => await (0, manyRates_1.getPopularRates)(),
    });
    reply.send(JSON.stringify(bestRates));
});
server.get("/crypto=:code/:currency/:side", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const params = request.params;
    const code = params.code.toUpperCase();
    const currency = params.currency?.toUpperCase();
    const side = params.side;
    const rates = await (0, helper_1.toCache)({
        key: `crypto_${code}_${currency}_${side}`,
        ttl: 30 * 1000,
        getData: async () => {
            const res = await (0, cryptoToCurrency_1.getCryptoToCurrencyRates)({ code, currency, side });
            return res;
        },
    });
    reply.send(JSON.stringify(rates));
});
///
const port = +process.env.RATES_PORT || 5000;
// Run the server!
const start = async () => {
    try {
        await server.listen({ port, host: "0.0.0.0" });
        //await auth();
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
};
start();
