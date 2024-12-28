import express from 'express';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import QueueHandler from './worker/queueHandler';
import FriendDataHandler from './worker/frinedsDataHandler';
import CacheHandler from './worker/cacheHandler';
import { LocationData } from './types/locationData';
import { UserModel } from './models/User'; 
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const io = new Server(3001);

app.use(express.json()); 

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch((err) => console.error('Redis connection error:', err));

const cacheHandler = new CacheHandler();
const queueHandler = new QueueHandler();
const friendDataHandler = new FriendDataHandler();

const LOCATION_UPDATE_INTERVAL = 1000;
const PROCESSING_TIMEOUT = 5 * 60 * 1000; 

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
        await cacheHandler.setLocation(username, { username, latitude, longitude }, 600);
      }

      const friendsData = await friendDataHandler.getFriends(username);
      const latitudeData: { username: string, latitude: number, longitude: number }[] = [];

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

      await queueHandler.enqueueLocationUpdate(username, latitude, longitude, latitudeData);
      console.log('Location update with friends\' data added to the global queue');
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

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

// Basic route to handle GET requests
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Route to set location in Redis (for testing)
app.post('/test/set-location', async (req, res) => {
  const { username, latitude, longitude } = req.body;
  const ttl = 600; // Time-to-live for the location in seconds

  try {
    const locationData = { username, latitude, longitude };
    
    await cacheHandler.setLocation(username, locationData, ttl);
    res.status(200).json({ message: 'Location set in Redis successfully' });
  } catch (error) {
    console.error('Error setting location:', error);
    res.status(500).json({ message: 'Error setting location in Redis' });
  }
});

app.get('/test/get-location/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const location = await cacheHandler.getLocation(username);
    if (location) {
      res.status(200).json(location);
    } else {
      res.status(404).json({ message: 'Location not found' });
    }
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ message: 'Error retrieving location from Redis' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app, io };
