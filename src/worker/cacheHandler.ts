import { createClient } from "redis";
import { LocationData } from "../types/locationData";

class CacheHandler {
  private redisClient;
  private geoKey = "userLocations";

  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error("Redis connection error:", err));
  }

  async setLocation(key: string, location: LocationData, ttl: number): Promise<void> {
    const { latitude, longitude } = location;
    await this.redisClient.geoAdd(this.geoKey, { member: key, latitude, longitude });
    await this.redisClient.setEx(`location:${key}`, ttl, JSON.stringify(location));
  }

  async getFriendsLocations(friends: string[]): Promise<LocationData[]> {
    const keys = friends.map((id) => `location:${id}`);
    const results = await this.redisClient.mGet(keys);
    return results
      .filter((result) => result !== null)
      .map((result) => JSON.parse(result as string));
  }
  async removeLocation(key: string): Promise<void> {
    await this.redisClient.zRem(this.geoKey, key);
    await this.redisClient.del(`location:${key}`);
  }
}

export default CacheHandler;
