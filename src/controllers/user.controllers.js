import {asyncHandler} from '../utils/asyncHandler.js';

const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend
    //validation - non empty data
    // user already exists (username/email se)
    //check for images,avatars
    //upload to cloudinary,avatar
    //create user object - create entry in DB
    //remove pass and refresh token from response
    //check for user creation(hua ya nhi)
    //return res else error

    const {fullName, email,username,password} = req.body;
    console.log(email,password)
})

export {registerUser};