import Inventory from "./model.js";

// Get all inventory items
export const getInventory = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const inventory = await Inventory.find(ownerFilter).sort({ createdAt: -1 });
        res.json(inventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create inventory item
export const createInventoryItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { productName, quantity, costPrice, sellingPrice, category, supplier, lowStockAlert, vatRate, sku } = req.body;

        if (!productName || quantity === undefined || !costPrice || !sellingPrice) {
            return res.json({ success: false, message: "Required fields missing" });
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
        res.json({ success: true, item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const { id } = req.params;
        const updates = req.body;

        const item = await Inventory.findOne({ _id: id, ...ownerFilter });
        if (!item) {
            return res.json({ success: false, message: "Item not found" });
        }

        Object.assign(item, updates);
        await item.save();
        res.json({ success: true, item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
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
            return res.json({ success: false, message: "Item not found" });
        }

        res.json({ success: true, message: "Item deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get low stock items
export const getLowStock = async (req, res) => {
    try {
        const userId = req.userId;
        const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
        const items = await Inventory.find(ownerFilter);

        const lowStock = items.filter(item => item.quantity <= item.lowStockAlert);
        res.json(lowStock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
