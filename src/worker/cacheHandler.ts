import { createClient } from "redis";
import { LocationData } from "../types/locationData";

class CacheHandler {
  private redisClient;
  private geoKey = "userLocations"; 

  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error("Redis connection error:", err));
  }

  // Set location
  async setLocation(key: string, location: LocationData, ttl: number): Promise<void> {
    try {
      const { latitude, longitude } = location;

      await this.redisClient.geoAdd(this.geoKey, {
        member: key,
        latitude,
        longitude,
      });

      await this.redisClient.setEx(
        `location:${key}`,
        ttl,
        JSON.stringify(location)
      );
    } catch (error) {
      console.error("Error setting location in Redis:", error);
    }
  }

  // Get location
  async getLocation(key: string): Promise<LocationData | null> {
    try {
      const data = await this.redisClient.get(`location:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting location from Redis:", error);
      return null;
    }
  }

  // Delete location
  async deleteLocation(key: string): Promise<void> {
    try {
      await this.redisClient.del(`location:${key}`);
    } catch (error) {
      console.error("Error deleting location from Redis:", error);
    }
  }

  // Get nearby users within a radius
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<LocationData[]> {
    try {
      const nearbyUserIds = await this.redisClient.geoSearch(
        this.geoKey, 
        { latitude, longitude },
        { radius, unit: "km" }
        );

      if (!nearbyUserIds || nearbyUserIds.length === 0) {
        return [];
      }

      const keys = nearbyUserIds.map((userId) => `location:${userId}`);
      const results = await this.redisClient.mGet(keys);

      return results
        .filter((result) => result !== null) 
        .map((result) => JSON.parse(result as string));
    } catch (error) {
      console.error("Error getting nearby users:", error);
      return [];
    }
  }


  //update multiple locations
  async batchUpdateLocations(
    locations: { key: string; data: LocationData }[],
    ttl: number
  ): Promise<void> {
    try {
      const pipeline = this.redisClient.multi();

      locations.forEach(({ key, data }) => {
        const { latitude, longitude } = data;

        pipeline.geoAdd(this.geoKey, {
          member: key,
          latitude,
          longitude,
        });

        pipeline.setEx(
          `location:${key}`,
          ttl,
          JSON.stringify(data)
        );
      });

      await pipeline.exec(); 
      console.log("Batch update completed.");
    } catch (error) {
      console.error("Error performing batch update:", error);
    }
  }
}

export default CacheHandler;
