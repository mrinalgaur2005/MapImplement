import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PointModel from '@/src/models/Map';
import dbConnect from '@/src/db/connectDb';

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { lat, lng, username } = body;

    // Validate input
    if (!lat || !lng || typeof username !== 'string') {
      return NextResponse.json({ message: 'Invalid input data' }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();

    // Save location to MongoDB
    const newLocation = new PointModel({
      latitude: lat,
      longitude: lng,
      username,
    });

    await newLocation.save();

    return NextResponse.json({ message: 'Location saved successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error saving location:', error);
    return NextResponse.json({ message: 'Error saving location' }, { status: 500 });
  }
}
