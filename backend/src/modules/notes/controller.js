import NoteModel from "./model.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";

// Get all notes for logged-in user
export const getAllNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const orgId = req.orgId;
    const ownerFilter = orgId ? { orgId } : { userId };

    const notes = await NoteModel.find(ownerFilter)
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { data: notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return sendError(res, { status: 500, message: "Failed to fetch notes" });
  }
};

// Get a single note by id
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const note = await NoteModel.findOne({ _id: id, ...ownerFilter }).lean();
    if (!note) {
      return sendError(res, { status: 404, message: "Note not found" });
    }

    return sendSuccess(res, { data: note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return sendError(res, { status: 500, message: "Failed to fetch note" });
  }
};

// Add new note
export const addNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    if (!title || !content) {
      return sendError(res, { status: 400, message: "Title and content are required" });
    }

    const note = new NoteModel({
      userId,
      orgId: req.orgId,
      title,
      content,
    });

    await note.save();

    return sendCreated(res, note, "Note created");
  } catch (error) {
    console.error("Error adding note:", error);
    return sendError(res, { status: 500, message: "Failed to add note" });
  }
};

// Update note
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    // Find note and verify ownership
    const note = await NoteModel.findOne({ _id: id, ...ownerFilter });

    if (!note) {
      return sendError(res, { status: 404, message: "Note not found" });
    }

    // Update
    note.title = title || note.title;
    note.content = content || note.content;

    await note.save();

    return sendSuccess(res, { data: note, message: "Note updated" });
  } catch (error) {
    console.error("Error updating note:", error);
    return sendError(res, { status: 500, message: "Failed to update note" });
  }
};

// Delete note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    // Find and delete note (verify ownership)
    const note = await NoteModel.findOneAndDelete({ _id: id, ...ownerFilter });

    if (!note) {
      return sendError(res, { status: 404, message: "Note not found" });
    }

    return sendSuccess(res, { message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return sendError(res, { status: 500, message: "Failed to delete note" });
  }
};
