import { createClient } from 'redis';

class QueueHandler {
  private redisClient;
  private queueKey = 'locationQueue';
  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error('Redis connection error:', err));
  }

  // Enqueue a location update with timestamp and LatitudeData for friends
  async enqueueLocationUpdate(username: string, latitude: number, longitude: number, latitudeData: { username: string, latitude: number, longitude: number }[]): Promise<void> {
    try {
      const timestamp = Date.now(); // Capture the time the update is received
      const locationUpdate = JSON.stringify({ username, latitude, longitude, latitudeData, timestamp });
      await this.redisClient.rPush(this.queueKey, locationUpdate);
      console.log(`Location update for ${username} added to the global queue with timestamp ${timestamp}`);
    } catch (error) {
      console.error('Error enqueuing location update:', error);
    }
  }

  // Dequeue a location update and process it if it's older than 5 minutes
  async dequeueLocationUpdate(): Promise<{ username: string; latitude: number; longitude: number; latitudeData: { username: string, latitude: number, longitude: number }[] } | null> {
    try {
      const item = await this.redisClient.lPop(this.queueKey);
      if (item) {
        const locationUpdate = JSON.parse(item);
        const currentTime = Date.now();
        const timeout = 5 * 60 * 1000;// 5 minutes timeout

        // Check if 5 minutes have passed
        if (currentTime - locationUpdate.timestamp >= timeout) {
          return locationUpdate;
        } else {
          // If not, re-enqueue the item to check again later
          await this.redisClient.rPush(this.queueKey, item);
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error dequeuing location update:', error);
      return null;
    }
  }

  // Get the current size of the queue
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
