import Transaction from "../models/Transaction.js";

// Get all transactions
export const getTransactions = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { type, startDate, endDate } = req.query;

        let query = { userId };
        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { type, category, amount, description, date, paymentMethod } = req.body;

        if (!type || !category || !amount || !description) {
            return res.json({ success: false, message: "All fields are required" });
        }

        const transaction = new Transaction({
            type,
            category,
            amount,
            description,
            date,
            paymentMethod,
            userId,
        });

        await transaction.save();
        res.json({ success: true, transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update transaction
export const updateTransaction = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;
        const updates = req.body;

        const transaction = await Transaction.findOne({ _id: id, userId });
        if (!transaction) {
            return res.json({ success: false, message: "Transaction not found" });
        }

        Object.assign(transaction, updates);
        await transaction.save();
        res.json({ success: true, transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { id } = req.params;

        const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
        if (!transaction) {
            return res.json({ success: false, message: "Transaction not found" });
        }

        res.json({ success: true, message: "Transaction deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get summary
export const getSummary = async (req, res) => {
    try {
        const userId = req.userId; // From userAuth middleware
        const { startDate, endDate } = req.query;

        let query = { userId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query);

        const summary = {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            incomeByCategory: {},
            expenseByCategory: {},
        };

        transactions.forEach(t => {
            if (t.type === 'income') {
                summary.totalIncome += t.amount;
                summary.incomeByCategory[t.category] = (summary.incomeByCategory[t.category] || 0) + t.amount;
            } else {
                summary.totalExpense += t.amount;
                summary.expenseByCategory[t.category] = (summary.expenseByCategory[t.category] || 0) + t.amount;
            }
        });

        summary.balance = summary.totalIncome - summary.totalExpense;

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};