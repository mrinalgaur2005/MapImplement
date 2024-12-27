import { app, io } from './app'; 
import QueueHandler from './worker/queueHandler';
import FriendDataHandler from './worker/frinedsDataHandler';
import CacheHandler from './worker/cacheHandler';
import { LocationData } from './types/locationData';

// Initialize handlers
const queueHandler = new QueueHandler();
const friendDataHandler = new FriendDataHandler();
const cacheHandler = new CacheHandler();

const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes interval

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('locationUpdate', async (data: LocationData) => {
    try {
      const { username, latitude, longitude } = data;

      ///user into cache put krdia
      await cacheHandler.setLocation(username, { username, latitude, longitude }, 600);

      const friends = await friendDataHandler.getFriends(username);

      //data into queue put krdia
      for (const friend of friends) {
        const friendLocation = await cacheHandler.getLocation(friend.sid);
        if (friendLocation) {
          await queueHandler.enqueueLocationUpdate(friend.sid, friendLocation.latitude, friendLocation.longitude);
        }
      }

      console.log('Location update added to the queue');
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

  //5 min me data dega ye
  setInterval(async () => {
    try {
      const queueSize = await queueHandler.getQueueSize();
      if (queueSize > 0) {
        console.log(`Queue size: ${queueSize} items waiting for processing`);
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

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
