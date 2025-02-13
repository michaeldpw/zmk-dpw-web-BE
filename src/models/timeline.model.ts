
import { Schema, model } from "mongoose";
import { UserModel } from "./user.model";

export const TimelineSchema = new Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false }, // S3 URL
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: UserModel,
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
});

export const TimelineModel = model<any>('timeline', TimelineSchema);
