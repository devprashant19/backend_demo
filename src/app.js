//Middleware - Data Checking when client sends and server receives

import express from "express";
import cors from "cors";// middleware to use Cross Origin Resource Sharing
import cookieParser from "cookie-parser";//to get user data from cookies and also set cookies for user

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,//kaha kaha se data aa skta h
    credentials:true,
}
))//app.use is for definitions or middlewares

app.use(express.json({
    limit:"16kb",//define kitna data aa skta h
}))//Allow json files

app.use(express.urlencoded({//url se data lena
    extended:true,//objects ke andar objects lena
    limit:"16kb",
}))

app.use(express.static("public"))

app.use(cookieParser())

//app.get("/",(err,req,res,next)=>{}) // Actual Syntax - next is for middleware ki ab next checking pe jao ye wali ho gyi
export { app };