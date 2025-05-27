// require("dotenv").config({path:"./env"})
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js"
dotenv.config()
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000,()=>{
            console.log(`Example app listening on PORT http://localhost:${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MongoDB Connection Error :", err)
    });












/*
import express from "express";
const app=express();
;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error:",error)
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.log(error);
    }
})()*/