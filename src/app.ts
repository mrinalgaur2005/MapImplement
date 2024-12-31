import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import QueueHandler from './worker/queueHandler';
import FriendDataHandler from './worker/frinedsDataHandler';
import CacheHandler from './worker/cacheHandler';
import { LocationData } from './types/locationData';
import dotenv from 'dotenv';
import dbConnect from './db/connectDb';
import { studentData } from './testData/studentData';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const queueHandler = new QueueHandler();
const friendDataHandler = new FriendDataHandler();
const cacheHandler = new CacheHandler();

const LOCATION_UPDATE_INTERVAL = 1000; // Check every second
const PORT = 3000; // Server port

const clientsMap: Map<string, WebSocket> = new Map(); // Map for storing WebSocket with student ID

app.use(express.json());

wss.on('connection', (ws) => {
  console.log('A user connected');

  ws.on('message', async (message) => {
    try {
      await dbConnect();
      const data: LocationData = JSON.parse(message.toString());
      const { student_id, latitude, longitude } = data;

      // Save client WebSocket
      clientsMap.set(student_id, ws);

      // Set the user's location in the cache
      await cacheHandler.setLocation(student_id, { student_id, latitude, longitude }, 600);

      // Get friends' data
      const friendsData = await friendDataHandler.getFriends(student_id);
      const latitudeData: { student_id: string; latitude: number; longitude: number }[] = [];

      // Fetch each friend's location from the cache
      for (const friend of friendsData) {
        const friendLocation = await cacheHandler.getLocation(friend.student_id);
        if (friendLocation) {
          latitudeData.push({
            student_id: friend.student_id,
            latitude: friendLocation.latitude,
            longitude: friendLocation.longitude,
          });
        }
      }

      console.log(`Friends' location data: ${JSON.stringify(latitudeData)}`);

      // Add location update to the global queue
      await queueHandler.enqueueLocationUpdate(student_id, latitude, longitude, latitudeData);
      console.log('Location update added to the queue');
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

  ws.on('close', () => {
    console.log('A user disconnected');
    // Remove the client from the map
    clientsMap.forEach((client, student_id) => {
      if (client === ws) {
        clientsMap.delete(student_id);
        console.log(`Removed client with student_id: ${student_id}`);
      }
    });
  });
});

const broadcastActiveUsers = () => {
  const activeUsers = Array.from(clientsMap.keys());
  const message = JSON.stringify({ type: 'activeUsers', activeUsers });

  clientsMap.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};


wss.on('connection', (ws) => {
  ws.on('close', () => {
    clientsMap.forEach((client, student_id) => {
      if (client === ws) {
        clientsMap.delete(student_id);
        broadcastActiveUsers(); 
      }
    });
  });

  broadcastActiveUsers(); 
});


setInterval(async () => {
  try {
    const queueSize = await queueHandler.getQueueSize();
    if (queueSize > 0) {
      console.log(`Queue size: ${queueSize} items waiting for processing`);

      // Dequeue location update and send location data to the user
      const locationData = await queueHandler.dequeueLocationUpdate();
      if (locationData) {
        // Get the WebSocket client corresponding to the student_id
        const client = clientsMap.get(locationData.student_id);

        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(locationData));
          console.log(`Sent location data to ${locationData.student_id}`);
        } else {
          console.log(`Client for student_id ${locationData.student_id} is not connected or ready`);
        }
      }
    } else {
      console.log('No location updates in the queue');
    }

    // Broadcast active users
    broadcastActiveUsers();
  } catch (error) {
    console.error('Error processing location updates:', error);
  }
}, LOCATION_UPDATE_INTERVAL);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
