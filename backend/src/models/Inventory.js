import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    costPrice: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        default: 'general',
    },
    supplier: {
        type: String,
        default: '',
    },
    lowStockAlert: {
        type: Number,
        default: 10,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;