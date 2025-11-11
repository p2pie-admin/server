import { FastifyInstance } from "fastify";

import {
  createReplyHandler,
  createReplyOptionsHandler,
} from "./handler";

const registerCreateReplyRoute = (server: FastifyInstance) => {
  server.post("/createReply", createReplyHandler);
  server.options("/createReply", createReplyOptionsHandler);
};

export default registerCreateReplyRoute;
