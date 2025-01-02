import { createClient } from "redis";
import {WebSocket} from "ws";
class QueueHandler {
  private redisClient;
  private queueKey = "locationQueue";

  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error("Redis connection error:", err));
  }

  async enqueueLocationUpdate(
    student_id: string,
    latitude: number,
    longitude: number,
    latitudeData: { student_id: string; latitude: number; longitude: number }[]
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const locationUpdate = JSON.stringify({ student_id, latitude, longitude, latitudeData, timestamp });
      await this.redisClient.rPush(this.queueKey, locationUpdate);
    } catch (error) {
      console.error("Error enqueuing location update:", error);
    }
  }

  async processQueueBatch(batchSize: number, clientsMap: Map<string, WebSocket>): Promise<void> {
    try {
      const batch = await this.redisClient.lRange(this.queueKey, 0, batchSize - 1);
      if (batch.length > 0) {
        await this.redisClient.lTrim(this.queueKey, batchSize, -1);

        batch.forEach((item) => {
          const locationUpdate = JSON.parse(item);
          const client = clientsMap.get(locationUpdate.student_id);

          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(locationUpdate));
            console.log(`Sent location data to ${locationUpdate.student_id}`);
          } else {
            console.log(`Client for ${locationUpdate.student_id} is not connected`);
          }
        });
      }
    } catch (error) {
      console.error("Error processing queue batch:", error);
    }
  }

  async getQueueSize(): Promise<number> {
    try {
      return await this.redisClient.lLen(this.queueKey);
    } catch (error) {
      console.error("Error getting queue size:", error);
      return 0;
    }
  }
}

export default QueueHandler;
