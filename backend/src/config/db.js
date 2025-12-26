import mongoose from "mongoose";





 export const ConnectDB= async()=>{
    try{
        console.log("Trying to connect to MongoDB URI:", process.env.MONGO_URI ? "OK" : "MONGO_URI MISSING");
       await mongoose.connect(process.env.MONGO_URI);
console.log("Database connected successfully");

    }
    catch(err){
        console.log("Database connection failed",err);
        process.exit(1); //with failure
        
    }
}