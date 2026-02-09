import Todo from "./model.js";

// Get all todos for user
export const getTodos = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const orgId = req.orgId;
        const ownerFilter = orgId ? { orgId } : { userId };
        const todos = await Todo.find(ownerFilter).sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
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
            orgId: req.orgId,
        });

        await todo.save();
        res.json({ success: true, todo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update todo
export const updateTodo = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;
        const updates = req.body;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

        const todo = await Todo.findOne({ _id: id, ...ownerFilter });
        if (!todo) {
            return res.json({ success: false, message: "Todo not found" });
        }

        Object.assign(todo, updates);
        await todo.save();
        res.json({ success: true, todo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
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
            return res.json({ success: false, message: "Todo not found" });
        }

        res.json({ success: true, message: "Todo deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
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
            return res.json({ success: false, message: "Todo not found" });
        }

        todo.completed = !todo.completed;
        await todo.save();
        res.json({ success: true, todo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};