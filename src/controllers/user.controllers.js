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
    //return res else error

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
})

export { registerUser };