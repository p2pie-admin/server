import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";

type RedisValue = string | number | object;
type IDBName = "main" | "rates";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const port = process.env.REDIS_PORT || "6379";
const host =
  env === "production"
    ? process.env.PROD_REDIS_HOST || "redis"
    : process.env.DEV_REDIS_HOST || "127.0.0.1";

const mainDB = createClient({
  url: `redis://${host}:${port}/0`,
}) as RedisClientType;

const ratesDB = createClient({
  url: `redis://${host}:${port}/1`,
}) as RedisClientType;

mainDB.connect().catch(() => console.log("Redis not responding!", "error"));
ratesDB.connect().catch(console.error);

export const setData = async (
  key: string,
  value: RedisValue,
  dbName: IDBName = "main",
  NX: boolean = false
) => {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;
    const strValue = JSON.stringify(value);

    await (NX ? db.set(key, strValue, { NX: true }) : db.set(key, strValue));
  } catch (error) {
    console.error(`Error setting data for ${dbName}:`, error);
  }
};

// export const addData = async (
//   key: string,
//   value: RedisValue,
//   dbName: IDBName = "main"
// ) => {
//   try {
//     const db = dbName === "rates" ? ratesDB : mainDB;
//     const prevValue = await getData(key, dbName);
//     const newValue = prevValue?.length
//       ? [...prevValue, value]
//       : { ...prevValue, value };
//     const strValue = JSON.stringify(newValue);
//     await db.set(key, strValue);
//   } catch (error) {
//     console.error(`Error setting data for ${dbName}:`, error);
//   }
// };

export async function setObject(
  key: string,
  object: Object, // Object containing keys and values
  dbName: IDBName = "main"
) {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;

    const redisData: { [key: string]: string } = {}; // Object for MSET

    // Helper function to recursively flatten the object
    function flattenObject(obj: any, parentKey: string) {
      for (const [k, v] of Object.entries(obj)) {
        const newKey = parentKey ? `${parentKey}:${k}` : k;

        if (v === null || v === undefined) {
          // Skip undefined or null values
          continue;
        }

        if (Array.isArray(v) || typeof v === "object") {
          // Recursively flatten objects and arrays
          flattenObject(v, newKey);
        } else {
          // Store primitive values directly
          redisData[newKey] = String(v);
        }
      }
    }

    // Start flattening from the top-level object
    flattenObject(object, key);

    // Use MSET to store all key-value pairs at once
    await db.mSet(redisData);
  } catch (error) {
    console.error(`Error setting multiple data for ${dbName}:`, error);
  }
}
export async function getObject(
  key: string,
  dbName: IDBName = "main"
): Promise<Object | null> {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;

    // Check if the key has a wildcard or is intended as a specific path
    const isPrefix = key.includes("*");
    const redisKeys = isPrefix
      ? await db.keys(`${key}`)
      : await db.keys(`${key}:*`);

    // If no keys found, return null
    if (redisKeys.length === 0) {
      return null;
    }

    // Get all values for the keys
    const redisData = await db.mGet(redisKeys);

    // Filter out null values and create a corresponding keys array
    const filteredRedisData = redisData.filter(
      (value: any): value is string => value !== null
    );
    const filteredRedisKeys = redisKeys.slice(0, filteredRedisData.length);

    const result: { [key: string]: any } = {};

    // Helper function to parse JSON strings safely
    function parseJSON(value: string) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // If parsing fails, return the original string
      }
    }

    // Helper function to reconstruct the object structure
    function reconstructObject(keys: string[], values: string[]) {
      for (let i = 0; i < keys.length; i++) {
        const fullKey = keys[i];
        const value = values[i];
        const keyParts = fullKey.split(":");

        // Build the nested structure
        let currentLevel = result;

        for (let j = 0; j < keyParts.length; j++) {
          const part = keyParts[j];

          // If we're at the last part, assign the parsed value
          if (j === keyParts.length - 1) {
            currentLevel[part] = parseJSON(value); // Parse the JSON here
          } else {
            // If the part doesn't exist yet, create an object
            if (!currentLevel[part]) {
              currentLevel[part] = {};
            }
            currentLevel = currentLevel[part]; // Move deeper into the object
          }
        }
      }
    }

    // Reconstruct the object using the retrieved keys and filtered values
    reconstructObject(filteredRedisKeys, filteredRedisData);

    // Navigate to the specific key in the nested structure if not using prefix
    if (!isPrefix) {
      const keyParts = key.split(":");
      let specificLevel = result;

      for (const part of keyParts) {
        if (!specificLevel[part]) {
          return null; // If a part is missing, return null
        }
        specificLevel = specificLevel[part];
      }

      return specificLevel; // Return the nested object
    }

    return result[key]; // Return the reconstructed object for prefix cases
  } catch (error) {
    console.error(`Error retrieving data for ${dbName}:`, error);
    return null;
  }
}

export async function getData(key: string, dbName: IDBName = "main") {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;
    const value = await db.get(key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`Error getting data for ${dbName}:`, error);
    return null;
  }
}

// Graceful shutdown for Redis connections
process.on("SIGINT", async () => {
  await mainDB.quit();
  await ratesDB.quit();
  console.log("Redis connections closed");
  process.exit(0);
});

let localDB = {};
export { localDB };
