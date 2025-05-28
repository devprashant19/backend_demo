import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js";

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

    const { fullName, email, username, password } = req.body;
    // if (fullName === "") {
    //     throw new ApiError(400, "Full Name is required")
    // }

    if(
        [fullName,email,username,password].some((field)=>(
        field?.trim()===""
    ))
){
        throw new ApiError(400, "All fields are required")
    }
})

export { registerUser };