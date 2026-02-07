import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    category: {
      type: String,
      default: "general",
    },
  },
  { timestamps: true }
);

// Indexes for better performance
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, completed: 1 });

const TodoModel = mongoose.model("todo", todoSchema);

export default TodoModel;