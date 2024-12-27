import mongoose, { Schema, Document, Model } from "mongoose";

export interface Point_Loc extends Document {
  latitude: number;
  longitude: number;
  username: string;
}

const LocationSchema: Schema = new Schema({
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
  },
  username: {
    type: String,
    required: true,
  },
});

// Check if the model already exists to prevent OverwriteModelError
const PointModel: Model<Point_Loc> =
  mongoose.models.Pointer || mongoose.model<Point_Loc>("Pointer", LocationSchema);

export default PointModel;
