import { createClient } from 'redis';

class QueueHandler {
  private redisClient;
  private queueKey = 'locationQueue';
  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error('Redis connection error:', err));
  }

  // Enqueue a location update with timestamp and LatitudeData for friends
  async enqueueLocationUpdate(student_id: string, latitude: number, longitude: number, latitudeData: { student_id: string, latitude: number, longitude: number }[]): Promise<void> {
    try {
      const timestamp = Date.now();
      const locationUpdate = JSON.stringify({ student_id, latitude, longitude, latitudeData, timestamp });
      await this.redisClient.rPush(this.queueKey, locationUpdate);
      console.log(`Location update for ${student_id} added to the global queue with timestamp ${timestamp}`);
    } catch (error) {
      console.error('Error enqueuing location update:', error);
    }
  }

  // Dequeue a location update and process it if it's older than 5 minutes
  async dequeueLocationUpdate(): Promise<{ student_id: string; latitude: number; longitude: number; latitudeData: { student_id: string, latitude: number, longitude: number }[] } | null> {
    try {
      const item = await this.redisClient.lPop(this.queueKey);
      if (item) {
        const locationUpdate = JSON.parse(item);
        const currentTime = Date.now();
        const timeout =  10 * 1000;//5sec timeout only for test

        if (currentTime - locationUpdate.timestamp >= timeout) {
          return locationUpdate;
        } else {
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
  async clearQueue(): Promise<void> {
    try {
      await this.redisClient.del(this.queueKey);
      console.log('Queue has been cleared.');
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }
}

export default QueueHandler;
