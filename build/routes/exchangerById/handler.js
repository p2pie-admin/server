"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangerByIdHandler = void 0;
const redis_1 = require("../../redis");
const exchangerByIdHandler = async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const { idOrName } = request.params;
    const exchangers = (await (0, redis_1.getObject)("exchangers"));
    reply.send(JSON.stringify(exchangers && Object.keys(exchangers).length
        ? exchangers[idOrName] ||
            Object.values(exchangers).find((e) => e.name.toLocaleLowerCase() === idOrName.toLocaleLowerCase() ||
                (e.display_name || "").toLocaleLowerCase() ===
                    idOrName.toLocaleLowerCase()) ||
            {}
        : "no exchangers exist"));
};
exports.exchangerByIdHandler = exchangerByIdHandler;
