import NoteModel from "../models/Note.js";

// Get all notes for logged-in user
export const getAllNotes = async (req, res) => {
  try {
    const userId = req.userId;
    
    const notes = await NoteModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

// Add new note
export const addNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const note = new NoteModel({
      userId,
      title,
      content,
    });

    await note.save();

    res.status(201).json(note);
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Failed to add note" });
  }
};

// Update note
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.userId;

    // Find note and verify ownership
    const note = await NoteModel.findOne({ _id: id, userId });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Update
    note.title = title || note.title;
    note.content = content || note.content;

    await note.save();

    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Failed to update note" });
  }
};

// Delete note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find and delete note (verify ownership)
    const note = await NoteModel.findOneAndDelete({ _id: id, userId });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Failed to delete note" });
  }
};