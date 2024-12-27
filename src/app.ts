import express from 'express';
import { Server } from 'socket.io';

const app = express();
const io = new Server(3001);

app.use(express.json()); 

export { app, io };
