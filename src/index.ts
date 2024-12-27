// src/index.ts
import dotenv from 'dotenv';
import dbConnect from './db/connectDb';
import { app, io } from './app';
import QueueHandler from './worker/queueHandler';
import FriendDataHandler from './worker/frinedsDataHandler';
import CacheHandler from './worker/cacheHandler';
import { LocationData } from './types/locationData';

dotenv.config();

dbConnect();

const queueHandler = new QueueHandler();
const friendDataHandler = new FriendDataHandler();
const cacheHandler = new CacheHandler();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('locationUpdate', async (data: LocationData) => {
    try {
      // Add location update to the Redis queue
      await queueHandler.enqueueLocationUpdate(data.username, data.latitude, data.longitude);
      console.log('Location update added to the queue');
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });
});

// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
