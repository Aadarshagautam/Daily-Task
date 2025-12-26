import mongoose from "mongoose";

// 1. create a schema
// 2. model based on off of that schema

const noteshema= new mongoose.Schema({
    title:
    {
        type: String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    },
    {timestamps:true} //CreateAt and UpdateAT
);

const Note= mongoose.model("Note",noteshema);
export default Note;