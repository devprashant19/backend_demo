import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {//always await when calling db 
    try {//always wrap in try catch
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);//connect DB with backend
        console.log(`MongoDB connected!! DB Host: ${connectionInstance.connection.host}`)
    }
    catch (error) {
        console.log("MongoDB error failed:", error);
        process.exit(1);
    }
}

export default connectDB;
