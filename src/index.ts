import { app, io } from './app'; 
import QueueHandler from './worker/queueHandler';
import FriendDataHandler from './worker/frinedsDataHandler';
import CacheHandler from './worker/cacheHandler';
import { LocationData } from './types/locationData';

// Initialize handlers
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

      //user into cache
      await cacheHandler.setLocation(username, { username, latitude, longitude }, 600);

      // Get friends' location data
      const friendsData = await friendDataHandler.getFriends(username);
      const latitudeData = [];

      //data of frineds
      for (const friend of friendsData) {
        const friendLocation = await cacheHandler.getLocation(friend.sid);
        if (friendLocation) {
          latitudeData.push({
            username: friend.sid,
            latitude: friendLocation.latitude,
            longitude: friendLocation.longitude
          });
        }
      }

      //queue me add
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

        // Dequeue and send location update if the timeout has passed
        const locationData = await queueHandler.dequeueLocationUpdate();
        if (locationData) {
          // Send location data to the user along with their friends' location data
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

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
