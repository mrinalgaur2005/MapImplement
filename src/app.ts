import express from 'express';
import { Server } from 'socket.io';

const app = express();
const io = new Server(3001);



export {app,io};