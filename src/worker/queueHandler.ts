import { createClient } from 'redis';

class QueueHandler {
  private redisClient;
  private queueKey = 'locationQueue';

  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error('Redis connection error:', err));
  }

  async enqueueLocationUpdate(username: string, latitude: number, longitude: number): Promise<void> {
    try {
      const locationUpdate = JSON.stringify({ username, latitude, longitude });
      await this.redisClient.rPush(this.queueKey, locationUpdate);
      console.log(`Location update for ${username} added to the queue.`);
    } catch (error) {
      console.error('Error enqueuing location update:', error);
    }
  }

  async dequeueLocationUpdate(): Promise<{ username: string; latitude: number; longitude: number } | null> {
    try {
      const item = await this.redisClient.lPop(this.queueKey);
      if (item) {
        return JSON.parse(item);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error dequeuing location update:', error);
      return null;
    }
  }

  async getQueueSize(): Promise<number> {
    try {
      const size = await this.redisClient.lLen(this.queueKey);
      return size;
    } catch (error) {
      console.error('Error getting queue size:', error);
      return 0;
    }
  }
}

export default QueueHandler;
