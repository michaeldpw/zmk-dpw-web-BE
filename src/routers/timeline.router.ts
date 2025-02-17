const asyncHandler = require('express-async-handler');
import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleware";
import { TimelineModel } from '../models/timeline.model';

const router = Router();

const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME || 'zmk-dpw-s3-bucket',
        acl: "public-read", // Allow public access to images
        metadata: (req: any, file: any, cb: any) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: any, file: any, cb: any) => {
            const fileName = `timeline/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
    fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed!"), false);
        }

        cb(null, true);
    }

});

router.post('/create', verifyJWT, upload.single("image"), asyncHandler(
    async (req: any, res: any) => {
        try {
            const { id } = req.user;
            console.log(id);
            const { title, date, description, createdBy } = req.body;
            const imageUrl = req.file ? req.file.location : ''; // S3 URL

            const event = {
                title,
                date,
                description,
                imageUrl,
                createdBy: id,
            };
            const createdTimeline = await TimelineModel.create(event);
            res.status(200).json({ success: true, createdTimeline });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });

        }
    }
));

router.get("/", verifyJWT, asyncHandler(
    async (req: any, res: any) => {
        try {
            const timelines = await TimelineModel.find().sort({ date: 1 }); // Sort by date (oldest to newest)
            res.json({ success: true, timelines });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
));


// export default router;
module.exports = router;
