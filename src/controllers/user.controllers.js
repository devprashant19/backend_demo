import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponse.js';

const generateAccessAndRefreshTokens = async (UserId) => {
    try {
        const user = await User.findById(UserId);

        //generate Access token
        const accessToken = user.generateAccessToken()
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
export { registerUser, loginUser, logOutUser };