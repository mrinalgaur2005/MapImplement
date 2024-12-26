import dotenv from 'dotenv';
import dbConnect from './db/connectDb';
import { app,io } from './app';

dbConnect();

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('locationUpdate', (data) => {
        //add workers ki working idhr
    });
  });

