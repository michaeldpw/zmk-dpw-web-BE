import { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";


export interface User {
    id: string;
    email: string;
    password: string;
    refreshToken?: string;
    firstName: string;
    lastName: string;
    nickName: string;
    isAdmin: boolean;
    avatarUrl?: string;
    generateAccessToken: Function;
    generateRefreshToken: Function;
    isPasswordCorrect: Function;

}

export const UserSchema = new Schema<User>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nickName: { type: String, required: true },
    isAdmin: { type: Boolean, required: true },
    avatarUrl: { type: String }

}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
},

);

// Middleware to hash the password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the entered password is correct
UserSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate an access token
UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET || '',
        {
            expiresIn: "30m",
        }
    );
};

// Method to generate a refresh token
UserSchema.methods.generateRefreshToken = function () {
    console.log('rts', process.env.REFRESH_TOKEN_SECRET);
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET || '',
        {
            expiresIn: "30d",
        }
    );
};

export const UserModel = model<User>('user', UserSchema);
