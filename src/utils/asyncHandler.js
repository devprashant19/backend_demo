//using Promise
const asyncHandler = (requestHandler) => {
    (req,res,next)=>(
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))//directly promise bnake await
    )
}

export { asyncHandler };


//using try catch
// const asyncHandler2 = (fn) => async (req,res,next) => {
//     try{
//         await fn(req,res,next)
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message,
//         })//Response status send if error
//     }
// }