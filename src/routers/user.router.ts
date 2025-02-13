
import { Router } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { sample_users } from '../data';
import asyncHandler from 'express-async-handler'
import { User, UserModel } from "../models/user.model";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import { SECRET_CODE } from "../constants/secret_code";
import bcrypt from 'bcryptjs';
import { verifyJWT } from "../middleware/authMiddleware";

const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");


const router = Router();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer S3 Storage
const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: process.env.AWS_S3_BUCKET_NAME || 'zmk-dpw-s3-bucket',
        metadata: (req: any, file: any, cb: any) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: any, file: any, cb: any) => {
            cb(null, `avatars/${Date.now()}-${file.originalname}`);
        }
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
    fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed!"), false);
        }

        cb(null, true);
    }
});

// Upload Avatar Endpoint
router.post("/avatar", verifyJWT, upload.single("avatar"), asyncHandler(
    async (req: any, res: any) => {
        console.log('aaaa', process.env.AWS_BUCKET_NAME)
        try {
            const { userId } = req.user.id;
            const avatarUrl = req.file.location;

            console.log(req.user);

            const user = await UserModel.findOne({ email: req.user.email });
            console.log(user);
            if (!user) return res.status(404).json({ message: "User not found" });

            // If user already has an avatar, delete the old one from S3
            if (user.avatarUrl) {
                const oldKey = user.avatarUrl.split(".com/")[1];
                await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: oldKey }).promise();
            }

            // Update user's avatar URL in MongoDB
            user.avatarUrl = avatarUrl;
            await user.save();

            res.json({ message: "Avatar uploaded successfully!", avatarUrl });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    })
)



router.get("/seed", asyncHandler(
    async (req, res) => {
        console.log("seeding")
        const postCount = await UserModel.countDocuments();
        if (postCount > 0) {
            res.send("Users have been created");
            return;
        }
        await UserModel.create(sample_users);
        res.send("Seed is done!")
    })
)

//用户登录
router.post("/login", asyncHandler(
    async (req: any, res: any) => {
        const { email, password } = req.body;
        // Validate email and password presence
        if (!email || !password) {
            return res.status(400).json({ message: "需要提供邮箱和密码" });
        }
        try {
            const user = await UserModel.findOne({ email });
            // Check if the user exists
            if (!user) {
                return res.status(404).json({ message: "用户不存在" });
            }

            // Verify the correctness of the provided password
            const isPasswordValid = await user.isPasswordCorrect(password);

            // Handle incorrect password
            if (!isPasswordValid) {
                return res.status(401).json({ message: "密码错误" });
            }

            // Generate access and refresh tokens
            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                user.id
            );

            // Retrieve the logged-in user excluding sensitive information
            const loggedInUser = await UserModel.findById(user.id).select(
                "-password -refreshToken"
            );
            // Set options for cookies
            const options = {
                httpOnly: true,
                secure: true, // Enable in a production environment with HTTPS
            };
            // Set cookies with the generated tokens
            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json({
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                    message: `欢迎，${loggedInUser!.nickName}`,
                });

        } catch (error: any) {
            // Handle any errors that occur during the process
            return res.status(500).json({ message: error.message });
        }

        // if (user) {
        //     res.send(generateTokenResponse(user));
        // } else {
        //     res.status(400).send("邮箱或密码错误")
        // }

    }
));

//用户注册
router.post("/register", asyncHandler(
    async (req: any, res: any) => {
        const { email, password, nickName, firstName, lastName, secretCode } = req.body;

        // Check if email and password are provided
        if (!email || !password || !nickName || !firstName || !lastName || !secretCode) {
            return res.status(400).json({ message: "注册时有未填项" });
        }

        // 查看邀请码是否正确
        if (secretCode !== SECRET_CODE) {
            return res.status(HTTP_BAD_REQUEST).send("禁止注册！");

        }

        try {
            // 查询用户是否已经被注册
            const existedUser = await UserModel.findOne({ email });
            if (existedUser) {
                return res.status(HTTP_BAD_REQUEST).send("该邮箱已被注册,请使用其他邮箱");
            }
            const newUser = {
                id: '',
                email,
                firstName,
                lastName,
                nickName,
                password,
                isAdmin: true
            }
            // 在数据库中创建一个用户
            const user = await UserModel.create(newUser);
            // 获得该新用户，除了password和refreshToken 
            const createdUser = await UserModel.findById(user._id).select(
                "-password -refreshToken"
            );
            // 查看是否创建成功了
            if (!createdUser) {
                return res.status(500).json({ message: "Something went wrong" });
            }

            // Generate access and refresh tokens
            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                user.id
            );
            // Send a success response with the created user details
            return res
                .status(201)
                .json({
                    user: createdUser,
                    accessToken,
                    refreshToken,
                    message: "注册成功"
                });
        } catch (error: any) {
            // Handle any errors that occur during the process
            return res.status(500).json({ message: error.message });
        }



        // res.send(generateTokenResponse(dbUser));



    }
))

router.post("/logout", verifyJWT, asyncHandler(
    async (req: any, res: any) => {
        // Remove the refresh token from the user's information
        await UserModel.findByIdAndUpdate(
            req.body.user._id,
            {
                $set: { refreshToken: undefined },
            },
            { new: true }
        );

        // Set options for cookies
        const options = {
            httpOnly: true,
            secure: true, // Enable in a production environment with HTTPS
        };

        // Clear the access and refresh tokens in cookies
        return res
            .status(200)
            .cookie("accessToken", options)
            .cookie("refreshToken", options)
            .json({ user: {}, message: "您已退出账号" });
    }
))


router.post("/refresh-token", asyncHandler(
    async (req: any, res: any) => {
        // Retrieve the refresh token from cookies or request body
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.body.refreshToken;

        // If no refresh token is present, deny access with a 401 Unauthorized status
        if (!incomingRefreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        try {
            // Verify the incoming refresh token using the secret key
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET || ''
            ) as JwtPayload;

            // Find the user associated with the refresh token
            const user = await UserModel.findById(decodedToken?._id);

            // If the user isn't found, deny access with a 404 Not Found status
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // If the stored refresh token doesn't match the incoming one, deny access with a 401 Unauthorized status
            if (user?.refreshToken !== incomingRefreshToken) {
                return res.status(401).json({ message: "Refresh token is incorrect" });
            }

            // Set options for cookies
            const options = {
                httpOnly: true,
                secure: true, // Enable in a production environment with HTTPS
            };

            // Generate new access and refresh tokens for the user
            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                user.id
            );

            // Set the new tokens in cookies
            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json({ accessToken, refreshToken, message: "Access token refreshed" });
        } catch (error: any) {
            // Handle any errors during token refresh with a 500 Internal Server Error status
            return res.status(500).json({ message: error.message });
        }
    }
))


const generateAccessAndRefreshTokens = async (userId: string) => {
    try {
        // Find the user by ID in the database
        const user = await UserModel.findById(userId);

        if (user) {
            // Generate an access token and a refresh token
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();
            // Save the refresh token to the user in the database
            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });

            // Return the generated tokens
            return { accessToken, refreshToken };
        } else {
            return {};
        }



    } catch (error: any) {
        // Handle any errors that occur during the process
        throw new Error(error.message);
    }
};

router.put("/update-password", verifyJWT, asyncHandler(

    async (req: any, res: any) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;
            console.log(oldPassword);


            // Validate request
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Both old and new passwords are required' });
            }

            // Fetch user from the database
            const user = await UserModel.findById(userId);
            console.log(user);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Compare old password with the stored hash
            const isMatch = await user.isPasswordCorrect(oldPassword);
            console.log(isMatch);
            if (!isMatch) {
                return res.status(400).json({ message: '旧密码有误' });
            }

            // Update password in database
            user.password = newPassword;
            await user.save();

            return res.json({ message: '您的密码已更新' });
        } catch (error: any) {
            console.error('Error updating password:', error);
            res.status(500).json({ message: 'Internal server error' });
        }

    }
))



export default router;
