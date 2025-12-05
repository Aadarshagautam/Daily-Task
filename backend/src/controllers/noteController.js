import Note from "../models/Note.js";

export async function getAllNotes(req,res){
    try{
const notes=await Note.find().sort({createAt:-1}); //newest Firsts
res.status(200).json(notes);
    }
    catch(error){
console.error("Error in getAllNotes:",error);
res.status(500).json({message:"Internal Server Error"});
    }
}

export async function getNoteById(req,res){
    try {
        const note= await Note.findById(req.params.id);
        if(!note)return res.status(404).json({message:"Note not found"});
        res.status(500).json(note);
    } catch (error) {
        console.error("Error in getNoteById:",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export async function createNotes(req, res) {
try{
const {titles,content}= req.body;
const newNote= new Note ({titles,content});

const savedNote = await note.save();
res.status(200).json({message:"Note created successfully",note:newNote});
console.log(titles,content);
}
catch(error){
    console.error("Error in createAllNotes:",error);
    res.status(500).json(savedNote);
}
}

export async function updatedNotes(req, res) {

try {
    const{titles,content}=req.body;
    const updatedNotes= await Note.findByIdAndUpdate(req.params.id,{titles,content},
        {new:true},

    );
    if(!updatedNotes) return res.status(404).json({message:"Note not found"})
    res.status(200).json(updatedNotes)
} catch (error) {
    console.error("Error in updateAllNotes:",error);
    res.status(500).json({message:"Internal server Error"});
}
}
export async function deleteNotes(req, res) {
    try {
        const deleteNote= await Note.findByIdAndDelete(req.params.id);
if(!deleteNote) return res.status(404).json({message:"Note not found"})
    res.status(200).json(deleteNote)
    } catch (error) {
        console.error("Error in delelteNote controller",error);
        res.status(500).json({message:"Internal server Error"});
    }
}