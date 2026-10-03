import Fastify from "fastify";
import dotenv from "dotenv";
import path from "path";
import fastifyStatic from "@fastify/static";
import registerCreateReviewRoute from "./routes/createReview";
import registerGeneralRoutes from "./routes/registrator";
import { startHistoryCollector } from "./history/collector";

dotenv.config();

export const cache = new Map(); // In-memory cache

const server = Fastify({
  logger: true,
  maxParamLength: 1000,
});

server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"), // Path to your public directory
  prefix: "/", // Optional: serve under a specific prefix
});

registerGeneralRoutes(server);
registerCreateReviewRoute(server);

///

const port = +process.env.RATES_PORT! || 5000;

// Run the server!
const start = async () => {
  try {
    await server.listen({ port, host: "0.0.0.0" });
    startHistoryCollector();
    //await auth();
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};
start();
