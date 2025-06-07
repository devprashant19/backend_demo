import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
//Direct encryption is not possible so we need mongoose hooks
//"Pre" hook mongoose middleware

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,//make it searchable
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,//cloudinary url
        required: true,
    },
    coverImage: {
        type: String,//cloudinary url
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password: {
        type: String,
        required: [true, 'Password required'],
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();//agr Pass change nhi hua to next
    this.password = await bcrypt.hash(this.password, 10);
    next();
})//don't use arrow fn callback
//middleware call krne me time lega so async
//middleware hai to "next" ayega

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign({//generates token
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
    }
)
}
userSchema.methods.generateRefreshToken = function (){
    return jwt.sign({//generates token
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
    }
)
}
export const User = mongoose.model("User", userSchema);