import { FastifyReply, FastifyRequest } from "fastify";

import { getData } from "../../redis";
import { IParserSetting } from "../../types";

export const parserSettingHandler = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const parserSetting = (await getData("parser_setting")) as
    | IParserSetting
    | null;
  return reply.send(JSON.stringify(parserSetting));
};
