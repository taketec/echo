import { Redis } from "ioredis";

let REDIS_URL = process.env.REDIS_URL

// Connect to Redis instance
const redis = new Redis(REDIS_URL);

// Function to delete all key-value pairs
async function deleteAllKeys() {
  try {
    const keys = await redis.keys('*'); // Get all keys
    console.log(keys)
    if (keys.length > 0) {
      await redis.del(...keys); // Delete all keys
      console.log(`Deleted ${keys.length} keys.`);
    } else {
      console.log('No keys to delete.');
    }
  } catch (error) {
    console.error('Error deleting keys:', error);
  } finally {
    redis.disconnect(); // Close the Redis connection
  }
}

// Execute the delete function
deleteAllKeys();
