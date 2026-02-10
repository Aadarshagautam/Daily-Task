import Todo from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";

// Get all todos for user
export const getTodos = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const orgId = req.orgId;
        const ownerFilter = orgId ? { orgId } : { userId };
        const todos = await Todo.find(ownerFilter).sort({ createdAt: -1 });
        return sendSuccess(res, { data: todos });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Create todo
export const createTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { title, description, priority, dueDate, category } = req.body;

        if (!title) {
            return sendError(res, { status: 400, message: "Title is required" });
        }

        const todo = new Todo({
            title,
            description,
            priority,
            dueDate,
            category,
            userId,
            orgId: req.orgId,
        });

        await todo.save();
        return sendCreated(res, todo, "Todo created");
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Update todo
export const updateTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;
        const updates = pick(req.body, [
            "title",
            "description",
            "priority",
            "dueDate",
            "category",
            "completed",
        ]);
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

        if (Object.keys(updates).length === 0) {
            return sendError(res, { status: 400, message: "No valid fields to update" });
        }

        const todo = await Todo.findOneAndUpdate(
            { _id: id, ...ownerFilter },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!todo) {
            return sendError(res, { status: 404, message: "Todo not found" });
        }

        return sendSuccess(res, { data: todo, message: "Todo updated" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Delete todo
export const deleteTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middlewareId
        const { id } = req.params;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

        const todo = await Todo.findOneAndDelete({ _id: id, ...ownerFilter });
        if (!todo) {
            return sendError(res, { status: 404, message: "Todo not found" });
        }

        return sendSuccess(res, { message: "Todo deleted" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Toggle todo completion
export const toggleTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

        const todo = await Todo.findOne({ _id: id, ...ownerFilter });
        if (!todo) {
            return sendError(res, { status: 404, message: "Todo not found" });
        }

        todo.completed = !todo.completed;
        await todo.save();
        return sendSuccess(res, { data: todo, message: "Todo updated" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};
