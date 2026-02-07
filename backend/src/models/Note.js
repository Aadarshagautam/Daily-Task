import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ title: 'text', content: 'text' }); // For search

const NoteModel = mongoose.model("note", noteSchema);

export default NoteModel;