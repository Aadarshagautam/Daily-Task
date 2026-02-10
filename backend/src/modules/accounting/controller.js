import Transaction from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";

// Get all transactions
export const getTransactions = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { type, startDate, endDate } = req.query;

        let query = { ...ownerFilter };
        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });
        return sendSuccess(res, { data: transactions });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const userId = req.userId;
        const { type, category, amount, description, date, paymentMethod } = req.body;

        if (!type || !category || !amount || !description) {
            return sendError(res, { status: 400, message: "All fields are required" });
        }

        const transaction = new Transaction({
            type,
            category,
            amount,
            description,
            date,
            paymentMethod,
            userId,
            orgId: req.orgId,
        });

        await transaction.save();
        return sendCreated(res, transaction, "Transaction created");
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Update transaction
export const updateTransaction = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { id } = req.params;
        const updates = pick(req.body, [
            "type",
            "category",
            "amount",
            "description",
            "date",
            "paymentMethod",
        ]);

        if (Object.keys(updates).length === 0) {
            return sendError(res, { status: 400, message: "No valid fields to update" });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: id, ...ownerFilter },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!transaction) {
            return sendError(res, { status: 404, message: "Transaction not found" });
        }

        return sendSuccess(res, { data: transaction, message: "Transaction updated" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { id } = req.params;

        const transaction = await Transaction.findOneAndDelete({ _id: id, ...ownerFilter });
        if (!transaction) {
            return sendError(res, { status: 404, message: "Transaction not found" });
        }

        return sendSuccess(res, { message: "Transaction deleted" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Get summary
export const getSummary = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { startDate, endDate } = req.query;

        let query = { ...ownerFilter };
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

        return sendSuccess(res, { data: summary });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};
