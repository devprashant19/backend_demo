import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    const existedUser = User.findOne({//checks existing user from model
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }


    //check for images,avatars
    //multer middleware adds req.files method
    const avatarLocalPath = req.files?.avatar[0]?.path// multer localPath for avatar
    const coverImageLocalPath = req.files?.coverImage[0]?.path// multer localPath for avatar

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
        avatar:avatar.url,//cloudinary returns response
        coverImage: coverImage?.url || "",//agr h to daalo else empty
        email,
        password,
        username:username.toLowerCase(),
    })

    //check for user creation
    // const createdUser = await User.findById(user._id)//returns user 
    //remove pass and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) 
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }

    //return response
})

export { registerUser };