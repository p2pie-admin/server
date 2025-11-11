import { FastifyInstance } from "fastify";

import { getData } from "../redis";
import { IParserSetting } from "../types";

const registerParserSettingRoute = (server: FastifyInstance) => {
  server.get("/parser_setting", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const parserSetting = (await getData(
      "parser_setting"
    )) as IParserSetting | null;
    return reply.send(JSON.stringify(parserSetting));
  });
};

export default registerParserSettingRoute;
