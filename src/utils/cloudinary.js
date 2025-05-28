import { v2 as cloudinary } from 'cloudinary';//to store files in this server
import fs from "fs";//file system node js module(used to read,write,etc. files)

// Configuration
cloudinary.config({ //or cloudinary.v2.config
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (LocalFilePath) => {
    try {
        if (!LocalFilePath) return null;
        //upload on cloudinary
        const response = await cloudinary.uploader
            .upload(LocalFilePath, { resource_type: 'auto' });
        //file has been uploaded
        console.log("File uploaded : ", response.url);
        return response;
    }
    catch (error) {
        fs.unlinkSync(LocalFilePath);//removes file from local file storage
        return null;
    }
}

export {uploadOnCloudinary};