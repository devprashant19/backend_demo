import { v2 as cloudinary } from 'cloudinary';//to store files in this server
import fs from "fs";//file system node js module(used to read,write,etc. files)
import dotenv from "dotenv";
dotenv.config();
// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
       if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("File Uploaded: ", response.url);
        // fs.unlinkSync(localFilePath)
        return response;
    }
    catch (error) {
        fs.unlinkSync(localFilePath);//removes file from local file storage
        return null;
    }
}

export { uploadOnCloudinary };