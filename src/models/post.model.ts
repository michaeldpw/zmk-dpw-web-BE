import { Schema, model } from "mongoose";
import { UserModel } from "./user.model";
import { IComment } from "./comment.model";

export interface Post {
    id: string; // Unique identifier for the post
    title: string; // Title of the post
    content: string; // Main content of the post
    author: object; // Author
    tags?: string[]; // Optional list of tags/categories
    createdAt: Date; // Date the post was created
    updatedAt: Date; // Date the post was last updated
    published: boolean; // Whether the post is published
    likesCount?: number; // Optional count of likes
    comments?: IComment[]; // Optional list of comments
}

// interface Comment {
//     id: string; // Unique identifier for the comment
//     postId: object; //指向post
//     parentCommentId: string; //指向父评论
//     author: object; // Author's ID or name
//     content: string; // Main content of the comment
//     createdAt: Date; // Date the comment was created
// }

// const CommentSchema = new Schema<Comment>(
//     {
//         id: {
//             type: String,
//             required: true
//         },
//         postId: {
//             type: Schema.Types.ObjectId,
//             ref: PostModel,
//             required: true

//         },
//         author: {
//             type: Schema.Types.ObjectId,
//             ref: UserModel,
//             required: true,
//         },
//         content: {
//             type: String,
//             required: true,
//         },
//         createdAt: {
//             type: Date,
//             default: Date.now,
//         },
//     },
//     { _id: true } // Enables automatic generation of a unique `_id` for each comment
// );
export const PostSchema = new Schema<Post>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: UserModel,
        required: true,
    },
    tags: {
        type: [String], // Array of strings for tags
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    published: {
        type: Boolean,
        default: false,
    },
    likesCount: {
        type: Number,
        default: 0,
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment',
    }],
},
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
        toJSON: {
            virtuals: true
        },

        toObject: {
            virtuals: true
        }
    },

);

export const PostModel = model<Post>('post', PostSchema);