import { Router } from "express";
const asyncHandler = require('express-async-handler')
import { PostModel } from "../models/post.model";
import { sample_posts } from "../data";
import { verifyJWT } from "../middleware/authMiddleware";
import { HTTP_BAD_REQUEST } from "../constants/http_status";



const router = Router();

// router.get("/seed", asyncHandler(
//     async (req, res) => {
//         console.log("seeding")
//         const postCount = await PostModel.countDocuments();
//         if (postCount > 0) {
//             res.send("Posts have been created");
//             return;
//         }
//         await PostModel.create(sample_posts);
//         res.send("Seed is done!")
//     })
// )

router.post("/create", verifyJWT, asyncHandler(
    async (req: any, res: any) => {
        const { userId, title, content } = req.body;
        const newPost = {
            title,
            content,
            author: userId
        };
        try {
            const createdPost = await PostModel.create(newPost);
            return res.status(200).json({ message: "您已发布一段新的文字" });

        } catch (error: any) {
            return res.status(500).json({ message: "创建失败" })
        }
    }
))

// 所有帖子
router.get("/", verifyJWT, asyncHandler(

    async (req: any, res: any) => {
        try {
            let { page = 1, limit = 10, } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);
            if (isNaN(page) || page < 1) page = 1;
            if (isNaN(limit) || limit < 1) limit = 10;
            const totalPosts = await PostModel.countDocuments();
            const posts = await PostModel.find()
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate("author", "nickName avatarUrl");
            res.json({
                totalItems: totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
                currentPage: page,
                pageSize: limit,
                data: posts
            });
        } catch (error: any) {
            res.status(500).json({ message: 'Server Error', error });
        }

    })
)

// 搜索单个帖子by ID
router.get("/:postId", verifyJWT, asyncHandler(
    async (req: any, res: any) => {
        try {
            const post = await PostModel.findById(req.params.postId).populate('author', 'avatarUrl nickName firstName lastName');
            if (post) {
                console.log(post);
                return res.send(post);
            }
            return res.status(404).send("未找到帖子")

        } catch (err: any) {
            return res.status(HTTP_BAD_REQUEST);

        }
    }
))

// 搜索单个帖子by search term
router.get("/search/:searchTerm", asyncHandler(
    async (req: any, res: any) => {
        const searchRegex = new RegExp(req.params.searchTerm, 'i'); // i表示大小写均可
        const posts = await PostModel.find({ title: { $regex: searchRegex } }); // 根据帖子的标题搜索
        res.send(posts);
    })
)







// export default router;
module.exports = router;