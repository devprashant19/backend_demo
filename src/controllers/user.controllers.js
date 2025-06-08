import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (UserId) => {
    try {
        const user = await User.findById(UserId);
        //generate Access token
        const accessToken = user.generateAccessToken();
        //generate refresh token
        const refreshToken = user.generateRefreshToken()
        //save refresh token to user model
        user.refreshToken = refreshToken;
        //save to db
        await user.save({ validateBeforeSave: false });//jb data dalenge to hr baar pass mangega cuz humne required bola h so we make it false ki dena na pde
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something whent wrong while generating refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation - non empty data
    // user already exists (username/email se)
    //check for images,avatars
    //upload to cloudinary,avatar
    //create user object - create entry in DB
    //remove pass and refresh token from response
    //check for user creation(hua ya nhi)
    //return response

    //get user details from frontend
    const { fullName, email, username, password } = req.body;
    // if (fullName === "") {
    //     throw new ApiError(400, "Full Name is required")
    // }
    //validation - non empty data
    if (
        [fullName, email, username, password].some((field) => (
            field?.trim() === ""
        ))
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // user already exists (username/email se)
    const existedUser = await User.findOne({//checks existing user from model
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }


    //check for images,avatars
    //multer middleware adds req.files method
    const avatarLocalPath = req.files?.avatar[0]?.path// multer localPath for avatar
    // const coverImageLocalPath = req.files?.coverImage[0]?.path// multer localPath for avatar
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path// multer localPath for avatar
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar required");
    }

    //upload to cloudinary,avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar required");
    }

    //create user object - create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,//cloudinary returns response
        coverImage: coverImage?.url || "",//agr h to daalo else empty
        email,
        password,
        username: username.toLowerCase(),
    })

    //check for user creation
    // const createdUser = await User.findById(user._id)//returns user 
    //remove pass and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //get pass,email from user
    //check if sent
    //user exists
    //password check
    //generate access and refresh token
    //send tokens to cookies
    //send success response

    //get pass,email from user
    const { email, username, password } = req.body;
    //check if sent by user
    if ([email, password].some((field) => (
        field?.trim() === ""))) {
        return new ApiError(400, "Both fields are required");
    }
    if (!(username || email)) {
        return new ApiError(400, "Either email or password required");
    }

    //check if user exists
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });
    if (!user) {
        return new ApiError(400, "User doesn't exist");
    }
    //password check
    // await User (not capital letter wala use kyuki wo mongoDB ka hai not our model wala)
    //so we'll use "user"
    const isPasswordValid = await user.isPasswordCorrect(password)//from bcrypt compare method in user model
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials");
    }

    //create access and refresh tokens
    //multiple time krne hote h so make a method
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    //send to cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken,
                },
                "User Logged In Successfully"
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    //remove cookies and tokens
    await User.findByIdAndUpdate(req.user?._id,
        {
            //remove refresh Token
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User Logged Out Successfully"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    //take incoming token
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }
    try {
        //check incoming token is correct or not
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        //now we can take user access since token contains user id (_id)
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }
        //user se token fetch and compare
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token Expired or used")
        }
        //if expired generate new
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        //save in cookie
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, newRefreshToken
                    },
                    "Access Token Refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    //user is logged in so req.user
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(401, "User not logged in");
    }
    //user model method to check pass
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password");
    }
    //update password 
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Password Updated Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    //after logged in
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    //file update kr rhe ho to make diff. end point
    const { fullName, email, } = req.body;

    if (!fullName && !email) {
        throw new ApiError(400, "ALl fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
            }
        },
        { new: true },//update hone ke baad jo update hui info print
    ).select("-password ");

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    //delete old avatar
    if (req.user.avatar) {
        const publicId = req.user.avatar.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
    }
    //multer se req.file(cuz 1 file only)
    const { avatarLocalPath } = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    //multer se req.file(cuz 1 file only)
    const { coverImageLocalPath } = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Cover Image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    //get user channel url
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username missing");
    }

    // User.find({username})
    //make aggregate pipeline with this username
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
            //1st pipeline
            $lookup: {
                from: "subscriptions",//Mongodb stores it as "subscriptions" form subscription schema model
                localField: "_id",
                foreignField: "channel",//count no. of channel to get subscribers
                as: "subscribers"
            },
            //2nd pipeline
            $lookup: {
                from: "subscriptions",//Mongodb stores it as "subscriptions" form subscription schema model
                localField: "_id",
                foreignField: "subscriber",//count no. of subscribed channels
                as: "subscribedTo"
            },
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"//count subscribers
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"//count channels subscribed to
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },//check whether user is subscribed
                        then: true,
                        else: false
                    }
                }
            },
            //3rd pipeline $project to give/send selected data
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])//this returns array with user detail object

    if (!channel?.length) {
        throw new ApiError(404, "Channel doesn't exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
})

export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile };