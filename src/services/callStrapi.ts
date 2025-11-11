import { GraphQLClient } from "graphql-request";

import normalizer from "./normalizer";
import dotenv from "dotenv";
import { getData } from "../redis";

dotenv.config();

const STRAPI_URL_ERROR =
  "Strapi endpoint is not configured. Set STRAPI (production) or DEV_STRAPI (development) to a full https?:// URL.";

const getStrapiLink = () => {
  const env = process.env.NODE_ENV === "production" ? "production" : "development";
  const rawLink =
    (env === "production"
      ? process.env.STRAPI ?? process.env.DEV_STRAPI
      : process.env.DEV_STRAPI ?? process.env.STRAPI) || "";

  if (!rawLink) {
    throw new Error(STRAPI_URL_ERROR);
  }

  if (!/^https?:\/\//i.test(rawLink)) {
    throw new Error(
      `Invalid Strapi endpoint: "${rawLink}". Please provide an absolute URL (e.g. https://example.com/graphql).`
    );
  }

  return rawLink;
};

const callStrapi = async (query: any, variables?: any) => {
  const strapiLink = getStrapiLink();
  const jwt = await getData("parser_jwt");
  const headers = jwt
    ? {
        authorization: `Bearer ${jwt}`,
      }
    : ({} as {});

  const graphQLClient = new GraphQLClient(strapiLink || "", {
    headers,
  });
  try {
    const data = await graphQLClient.request(query, variables);
    const res = normalizer(data);
    return res;
  } catch (err) {
    console.error("📙 \u001b[1;33m -- GQL ERROR -- ");
    console.error("📙 \u001b[1;33m JWT:", jwt);
    console.error(err);
    throw err;
  }
};

export default callStrapi;
