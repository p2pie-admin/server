import { FastifyInstance } from "fastify";

import { parserSettingHandler } from "./handler";

const registerParserSettingRoute = (server: FastifyInstance) => {
  server.get("/parser_setting", parserSettingHandler);
};

export default registerParserSettingRoute;
