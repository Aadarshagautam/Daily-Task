import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Make sure notes are tied to users
    },
}, {
    timestamps: true, // CreatedAt and UpdatedAt
});

const Note = mongoose.model("Note", noteSchema);
export default Note;