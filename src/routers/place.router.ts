import { Router } from "express";
const asyncHandler = require('express-async-handler');
import { verifyJWT } from "../middleware/authMiddleware";
import Place, { IPlace } from "../models/place.model";


const router = Router();

// POST /api/places
router.post('/', verifyJWT, asyncHandler(
    async (req: any, res: any) => {
        const { name, latitude, longitude } = req.body;

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ message: '无效的经纬度' });
        }

        try {
            const newPlace = new Place({ name, latitude, longitude });
            const saved = await newPlace.save();
            res.status(201).json(saved);
        } catch (err: any) {
            res.status(500).json({ message: '保存失败', error: err.message });
        }
    }
)
);

// GET /api/places
router.get('/', verifyJWT, asyncHandler(
    async (_req: any, res: any) => {
        try {
            const places = await Place.find().sort({ createdAt: -1 });
            res.json(places);
        } catch (err: any) {
            res.status(500).json({ message: '获取失败', error: err.message });
        }
    }

)
);


module.exports = router;


