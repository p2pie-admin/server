"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const normalizer_1 = __importDefault(require("./normalizer"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("../redis");
dotenv_1.default.config();
const STRAPI_URL_ERROR = "Strapi endpoint is not configured. Set STRAPI (production) or DEV_STRAPI (development) to a full https?:// URL.";
const getStrapiLink = () => {
    const env = process.env.NODE_ENV === "production" ? "production" : "development";
    const rawLink = (env === "production"
        ? process.env.STRAPI ?? process.env.DEV_STRAPI
        : process.env.DEV_STRAPI ?? process.env.STRAPI) || "";
    if (!rawLink) {
        throw new Error(STRAPI_URL_ERROR);
    }
    if (!/^https?:\/\//i.test(rawLink)) {
        throw new Error(`Invalid Strapi endpoint: "${rawLink}". Please provide an absolute URL (e.g. https://example.com/graphql).`);
    }
    return rawLink;
};
const callStrapi = async (query, variables) => {
    const strapiLink = getStrapiLink();
    const jwt = await (0, redis_1.getData)("parser_jwt");
    const headers = jwt
        ? {
            authorization: `Bearer ${jwt}`,
        }
        : {};
    const graphQLClient = new graphql_request_1.GraphQLClient(strapiLink || "", {
        headers,
    });
    try {
        const data = await graphQLClient.request(query, variables);
        const res = (0, normalizer_1.default)(data);
        return res;
    }
    catch (err) {
        console.error("📙 \u001b[1;33m -- GQL ERROR -- ");
        console.error("📙 \u001b[1;33m JWT:", jwt);
        console.error(err);
        throw err;
    }
};
exports.default = callStrapi;
