import Todo from "../models/Todo.js";

// Get all todos for user
export const getTodos = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create todo
export const createTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { title, description, priority, dueDate, category } = req.body;

        if (!title) {
            return res.json({ success: false, message: "Title is required" });
        }

        const todo = new Todo({
            title,
            description,
            priority,
            dueDate,
            category,
            userId,
        });

        await todo.save();
        res.json({ success: true, todo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update todo
export const updateTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;
        const updates = req.body;

        const todo = await Todo.findOne({ _id: id, userId });
        if (!todo) {
            return res.json({ success: false, message: "Todo not found" });
        }

        Object.assign(todo, updates);
        await todo.save();
        res.json({ success: true, todo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete todo
export const deleteTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middlewareId
        const { id } = req.params;

        const todo = await Todo.findOneAndDelete({ _id: id, userId });
        if (!todo) {
            return res.json({ success: false, message: "Todo not found" });
        }

        res.json({ success: true, message: "Todo deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle todo completion
export const toggleTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;

        const todo = await Todo.findOne({ _id: id, userId });
        if (!todo) {
            return res.json({ success: false, message: "Todo not found" });
        }

        todo.completed = !todo.completed;
        await todo.save();
        res.json({ success: true, todo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};