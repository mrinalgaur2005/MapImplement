import dotenv from 'dotenv';
import dbConnect from './db/connectDb';
import { app,io } from './app';
import { LocationData } from './types/locationData';

dbConnect();

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('locationUpdate', async (data:LocationData)=> {
        //add workers ki working idhr
        try {
            const { userId, latitude, longitude } = data;
        } catch (error) {
            
        }
    });
  });

