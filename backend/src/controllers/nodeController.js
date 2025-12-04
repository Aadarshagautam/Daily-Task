import Note from "../models/Note.js";

export async function getAllNotes(req,res){
    try{
const notes=await Note.find();
res.status(200).json(notes);
    }
    catch(error){
console.error("Error in getAllNotes:",error);
res.status(500).json({message:"Internal Server Error"});
    }
}



export function createAllNotes(req, res) {
    res.status(201).json({ message: "Notes created successfllu" });
}

export function updateAllNotes(req, res) {
    //create the notes 
    res.status(200).json({ message: "Notes update successfllu" });
}
export function deleteAllNotes(req, res) {
    //create the notes 
    res.status(201).json({ message: "Notes deleted successfllu" });
}