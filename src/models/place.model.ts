import mongoose, { Schema } from "mongoose";

export interface IPlace extends Document {
    name?: string;
    latitude: number;
    longitude: number;
    createdAt?: Date;
}

const PlaceSchema: Schema = new Schema({
    name: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPlace>('Place', PlaceSchema);