import { PostModel } from './post.model';
import { Schema, model, mongo } from "mongoose";
import { UserModel } from "./user.model";

const mongoose = require('mongoose');




export interface IComment {
    id: string; // Unique identifier for the comment
    post: object; //指向post
    parentComment: object; //指向父评论
    replies: object; // 子评论
    author: object; // Author's ID or name
    replyTo: object; // 指向回复另外用户
    content: string; // Main content of the comment
    createdAt: Date; // Date the comment was created
}

const CommentSchema = new Schema<IComment>(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: PostModel,
            required: true

        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null
        },
        replies: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Comment'
        }],
        author: {
            type: Schema.Types.ObjectId,
            ref: UserModel,
            required: true,
        },
        replyTo: {
            type: Schema.Types.ObjectId,
            ref: UserModel,
            default: null
        },
        content: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true } // Enables automatic generation of a unique `_id` for each comment
);

// export const CommentModel = model<Comment>('comment', CommentSchema);

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;