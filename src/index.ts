import { app, io } from './app';
import QueueHandler from './worker/queueHandler';
import FriendDataHandler from './worker/frinedsDataHandler';
import CacheHandler from './worker/cacheHandler';
import { LocationData } from './types/locationData';
import { UserModel } from './models/User'; // Import your UserModel here

const queueHandler = new QueueHandler();
const friendDataHandler = new FriendDataHandler();
const cacheHandler = new CacheHandler();

const LOCATION_UPDATE_INTERVAL = 1000; // Check every second
const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout for processing

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('locationUpdate', async (data: LocationData) => {
    try {
      const { username, latitude, longitude } = data;

      // Fetch user data from UserModel
      const user = await UserModel.findOne({ username });
      if (!user) {
        console.error('User not found');
        return;
      }

      if (user.isLocationAccess) {
        // Set the user's location into the cache with a TTL of 600 seconds
        await cacheHandler.setLocation(username, { username, latitude, longitude }, 600);
      }

      // Get the friends' data
      const friendsData = await friendDataHandler.getFriends(username);
      const latitudeData: { username: string, latitude: number, longitude: number }[] = [];

      // Fetch each friend's location from the cache
      for (const friend of friendsData) {
        const friendLocation = await cacheHandler.getLocation(friend.username);
        if (friendLocation) {
          latitudeData.push({
            username: friend.username,
            latitude: friendLocation.latitude,
            longitude: friendLocation.longitude,
          });
        }
      }

      // Add location update to the global queue
      await queueHandler.enqueueLocationUpdate(username, latitude, longitude, latitudeData);
      console.log('Location update with friends\' data added to the global queue');
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

  // Process the global queue every second
  setInterval(async () => {
    try {
      const queueSize = await queueHandler.getQueueSize();
      if (queueSize > 0) {
        console.log(`Queue size: ${queueSize} items waiting for processing`);

        // Dequeue location update and send location data to the user along with friends' location
        const locationData = await queueHandler.dequeueLocationUpdate();
        if (locationData) {
          io.to(locationData.username).emit('locationData', locationData);
          console.log(`Sent location data to ${locationData.username}`);
        }
      } else {
        console.log('No location updates in the queue');
      }
    } catch (error) {
      console.error('Error processing location updates:', error);
    }
  }, LOCATION_UPDATE_INTERVAL);
});
