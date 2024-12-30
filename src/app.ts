import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws'; // This imports the WebSocket class from the ws library
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
const wss = new WebSocketServer({ server }); // WebSocket server using ws library

const queueHandler = new QueueHandler();
const friendDataHandler = new FriendDataHandler();
const cacheHandler = new CacheHandler();

const PORT = 3000; 

const clientsMap: Map<string, WebSocket> = new Map(); // Map to store WebSocket connections for each student ID

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

wss.on('connection', (ws: WebSocket) => { // Explicitly typing the WebSocket as `WebSocket` from the ws library
  console.log('A user connected');

  ws.on('message', async (message: any) => { // Typing message as string since it's JSON data
    try {
      await dbConnect();
      const data: LocationData = JSON.parse(message);
      const { student_id, latitude, longitude } = data;
      
      // Store WebSocket connection for the student_id
      clientsMap.set(student_id, ws);

      // Example user data (from test data)
      const user = studentData;

      // Save the location in cache
      await cacheHandler.setLocation(student_id, { student_id, latitude, longitude }, 600);

      // Get friends' data and their locations from the cache
      const friendsData = await friendDataHandler.getFriends(user.student_id);
      const latitudeData: { student_id: string, latitude: number, longitude: number }[] = [];

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
      console.log(`Friends' locations data: ${JSON.stringify(latitudeData)}`);

      // Enqueue location update for processing
      await queueHandler.enqueueLocationUpdate(student_id, latitude, longitude, latitudeData);
      console.log('Location update with friends data added to the global queue');
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  });

  ws.on('close', () => {
    console.log('A user disconnected');
    // Clean up when a user disconnects
    clientsMap.forEach((client, student_id) => {
      if (client === ws) {
        clientsMap.delete(student_id);
      }
    });
  });
});

// Start processing the queue every second
setInterval(async () => {
  try {
    const queueSize = await queueHandler.getQueueSize();
    if (queueSize > 0) {
      console.log(`Queue size: ${queueSize} items waiting for processing`);

      const locationData = await queueHandler.dequeueLocationUpdate();
      if (locationData) {
        const client = clientsMap.get(locationData.student_id);

        if (client && client.readyState === WebSocket.OPEN) {
          console.log(`Sending location update to client: ${JSON.stringify(locationData)}`);
          client.send(JSON.stringify(locationData));
          console.log(`Sent location data to ${locationData.student_id}`);
        }
        
      }
    } else {
      console.log('No location updates in the queue');
    }
  } catch (error) {
    console.error('Error processing location updates:', error);
  }
}, 1000); // Check every second

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
