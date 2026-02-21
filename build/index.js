"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const static_1 = __importDefault(require("@fastify/static"));
const createReview_1 = __importDefault(require("./routes/createReview"));
const registrator_1 = __importDefault(require("./routes/registrator"));
dotenv_1.default.config();
exports.cache = new Map(); // In-memory cache
const server = (0, fastify_1.default)({
    logger: true,
    maxParamLength: 1000,
});
server.register(static_1.default, {
    root: path_1.default.join(__dirname, "../public"), // Path to your public directory
    prefix: "/", // Optional: serve under a specific prefix
});
(0, registrator_1.default)(server);
(0, createReview_1.default)(server);
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
