import Inventory from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";

// Get all inventory items
export const getInventory = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const inventory = await Inventory.find(ownerFilter).sort({ createdAt: -1 });
        return sendSuccess(res, { data: inventory });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Create inventory item
export const createInventoryItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { productName, quantity, costPrice, sellingPrice, category, supplier, lowStockAlert, vatRate, sku } = req.body;

        if (!productName || quantity === undefined || !costPrice || !sellingPrice) {
            return sendError(res, { status: 400, message: "Required fields missing" });
        }

        const item = new Inventory({
            productName,
            quantity,
            costPrice,
            sellingPrice,
            category,
            supplier,
            lowStockAlert,
            vatRate,
            sku,
            userId,
            orgId: req.orgId,
        });

        await item.save();
        return sendCreated(res, item, "Inventory item created");
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { id } = req.params;
        const updates = pick(req.body, [
            "productName",
            "quantity",
            "costPrice",
            "sellingPrice",
            "category",
            "supplier",
            "lowStockAlert",
            "vatRate",
            "sku",
        ]);

        if (Object.keys(updates).length === 0) {
            return sendError(res, { status: 400, message: "No valid fields to update" });
        }

        const item = await Inventory.findOneAndUpdate(
            { _id: id, ...ownerFilter },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!item) {
            return sendError(res, { status: 404, message: "Item not found" });
        }

        return sendSuccess(res, { data: item, message: "Item updated" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { id } = req.params;

        const item = await Inventory.findOneAndDelete({ _id: id, ...ownerFilter });
        if (!item) {
            return sendError(res, { status: 404, message: "Item not found" });
        }

        return sendSuccess(res, { message: "Item deleted" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Get low stock items
export const getLowStock = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const items = await Inventory.find(ownerFilter);

        const lowStock = items.filter(item => item.quantity <= item.lowStockAlert);
        return sendSuccess(res, { data: lowStock });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};
