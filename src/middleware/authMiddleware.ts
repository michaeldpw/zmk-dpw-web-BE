import { UserModel } from './../models/user.model';

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");


export const verifyJWT = asyncHandler(async (req: any, res: any, next: any) => {
    try {
        // Look for the token in cookies or headers
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        // If there's no token, deny access with a 401 Unauthorized status
        if (!token) {
            return res.status(401).json({ message: "令牌缺失" });
        }

        // Check if the token is valid using a secret key; the token could be expired
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Get the user linked to the token
        const user = await UserModel.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        // If the user isn't found, deny access with a 404 Not Found status
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Attach user info to the request for further use
        req.user = user;
        next();
    } catch (error: any) {
        // Handle any errors during token verification with a 500 Internal Server Error status
        return res.status(500).json({ message: error.message });
    }




    // let token;
    // if (
    //     req.headers.authorization &&
    //     req.headers.authorization.startsWith("Bearer")
    // ) {
    //     try {
    //         // get token from header
    //         token = req.headers.authorization.split(" ")[1];
    //         console.log(process.env.JWT_SECRET);

    //         // verify token
    //         const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //         // get user from the token
    //         req.user = await UserModel.findById(decoded.id).select("-password");

    //         next();
    //     } catch (error) {
    //         console.log("jwtToken", error);
    //         res.status(401).send(error);
    //         throw new Error("Not Authorized");
    //     }
    // }
    // if (!token) {
    //     res.status(401);
    //     throw new Error("Not Authorized, no token");
    // }
});

