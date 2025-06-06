//verifies user hai ya nhi

import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        //ya cookies se token nikalo ya header se
        //In header
        //Authorization: Bearer <token>
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        //check with jwt
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //from user.models.js generateAceessToken
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        //req me object create krke save
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
    }
})