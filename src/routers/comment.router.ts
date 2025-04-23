import { Router } from "express";
const asyncHandler = require('express-async-handler')
import { PostModel } from "../models/post.model";
import { verifyJWT } from "../middleware/authMiddleware";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
const Comment = require('../models/comment.model')



const router = Router();


//创建评论
router.post('/create', verifyJWT, asyncHandler(
    async (req, res) => {
        console.log(req.user);
        console.log('comment body', req.body);
        try {
            const { content, postId, parentCommentId } = req.body;
            if (!content) {
                return res.status(400).json({ error: "评论内容不能为空" });
            }
            let realParentId = parentCommentId || null;
            let replyTo = null;


            if (parentCommentId) {
                const parentComment = await Comment.findById(parentCommentId);
                if (!parentComment) {
                    return res.status(400).json({ error: "被回复的评论不存在" });
                }
                replyTo = parentComment.author;

                // 如果被回复的评论已经是二级（也就是它有 parentId），那我们就“提到一级”
                if (parentComment.parentComment) {
                    realParentId = parentComment.parentComment; // 让当前评论成为它祖先的子评论
                }

                // parentComment.replies.push(comment._id);
                // await parentComment.save();
            }

            const comment = new Comment({
                content,
                author: req.user,
                post: postId,
                parentComment: realParentId,
                replyTo
            });




            await comment.save();
            const newComment = await Comment.findById(comment.id)
                .populate('author', 'avatarUrl nickName firstName lastName')
                .populate('replyTo', 'avatarUrl nickName firstName lastName')

            console.log("newComment", newComment)
            res.status(201).json(newComment);


        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "创建评论失败" });
        }


    }
))

module.exports = router;
