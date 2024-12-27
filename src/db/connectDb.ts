import mongoose from 'mongoose';

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log('Already connected to the database');
    return;
  }

  if (!process.env.MONGO_DB_URI) {
    throw new Error('Missing MONGO_DB_URI in environment variables');
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_DB_URI);
    connection.isConnected = db.connections[0].readyState;
    console.log('Database successfully connected:', db.connection.name);
  } catch (error) {
    console.error('DB connection failed:', error);
    throw error;
  }
}

export default dbConnect;
