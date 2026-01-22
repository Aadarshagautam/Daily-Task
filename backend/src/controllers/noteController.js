import Note from "../models/note.js";

// GET ALL NOTES
export const getAllNotes=async(req, res) =>{
  try {
    const notes = await Note.find({user:req.userId}).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error in getAllNotes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// GET NOTE BY ID
export async function getNoteById(req, res) {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) {
    console.error("Error in getNoteById:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// CREATE NOTE
export async function createNotes(req, res) {
    console.log("Received body:", req.body);
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content required" });
    const newNote = new Note({ title, content });
    const savedNote = await newNote.save();
    console.log("Saved note:", savedNote);
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error in createNotes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// UPDATE NOTE
export async function updatedNotes(req, res) {
  try {
    const { title, content } = req.body;

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error in updateNotes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// DELETE NOTE
export async function deleteNotes(req, res) {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json(deletedNote);
  } catch (error) {
    console.error("Error in deleteNotes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
