import mongoose from "mongoose";
import PosSale from "../models/Sale.js";
import PosProduct from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import PosCustomer from "../models/Customer.js";
import { customerService } from "./customerService.js";

const ownerFilter = (req) =>
  req.orgId ? { orgId: req.orgId } : { userId: req.userId };

/**
 * Generate invoice number: INV-YYYYMMDD-XXXX
 */
async function generateInvoiceNo(orgId) {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const prefix = `INV-${dateStr}-`;

  const lastSale = await PosSale.findOne({
    invoiceNo: { $regex: `^${prefix}` },
  })
    .sort({ invoiceNo: -1 })
    .select("invoiceNo");

  let seq = 1;
  if (lastSale) {
    const lastSeq = parseInt(lastSale.invoiceNo.split("-").pop(), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export const saleService = {
  async create(data, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const allowNegative = process.env.ALLOW_NEGATIVE_STOCK === "true";

      // 1. Resolve products & build line items
      const lineItems = [];
      let subTotal = 0;
      let taxTotal = 0;

      for (const item of data.items) {
        const product = await PosProduct.findById(item.productId).session(
          session
        );
        if (!product)
          throw new Error(`Product not found: ${item.productId}`);
        if (!product.isActive)
          throw new Error(`Product is inactive: ${product.name}`);

        // Stock check
        if (!allowNegative && product.stockQty < item.qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${item.qty}`
          );
        }

        const price = item.price ?? product.sellingPrice;
        const lineDiscount = item.discount || 0;
        const taxableAmount = price * item.qty - lineDiscount;
        const lineTax = (taxableAmount * product.taxRate) / 100;
        const lineTotal = taxableAmount + lineTax;

        lineItems.push({
          productId: product._id,
          nameSnapshot: product.name,
          skuSnapshot: product.sku || "",
          qty: item.qty,
          price,
          discount: lineDiscount,
          tax: Math.round(lineTax * 100) / 100,
          lineTotal: Math.round(lineTotal * 100) / 100,
        });

        subTotal += price * item.qty;
        taxTotal += lineTax;

        // 2. Reduce stock
        await PosProduct.findByIdAndUpdate(
          product._id,
          { $inc: { stockQty: -item.qty } },
          { session }
        );

        // 3. Create stock movement
        await StockMovement.create(
          [
            {
              orgId: req.orgId || null,
              productId: product._id,
              type: "OUT",
              qty: item.qty,
              reason: "Sale",
              createdBy: req.userId,
            },
          ],
          { session }
        );
      }

      // 4. Calculate totals
      const overallDiscount = data.overallDiscount || 0;
      const discountTotal =
        lineItems.reduce((sum, i) => sum + i.discount, 0) + overallDiscount;
      taxTotal = Math.round(taxTotal * 100) / 100;
      subTotal = Math.round(subTotal * 100) / 100;
      const grandTotal =
        Math.round((subTotal - overallDiscount + taxTotal) * 100) / 100;

      // 5. Determine payment status
      const paidAmount = data.paidAmount ?? grandTotal;
      const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;
      let status = "paid";
      if (dueAmount > 0 && paidAmount > 0) status = "partial";
      if (paidAmount === 0) status = "due";

      // 6. Generate invoice number
      const invoiceNo = await generateInvoiceNo(req.orgId);

      // 7. Create sale
      const [sale] = await PosSale.create(
        [
          {
            userId: req.userId,
            orgId: req.orgId || null,
            invoiceNo,
            items: lineItems,
            subTotal,
            discountTotal,
            taxTotal,
            grandTotal,
            paymentMethod: data.paymentMethod || "cash",
            paidAmount,
            dueAmount,
            customerId: data.customerId || null,
            soldBy: req.userId,
            status,
            notes: data.notes || "",
          },
        ],
        { session }
      );

      // 8. If credit sale, add to customer balance
      if (
        dueAmount > 0 &&
        data.customerId &&
        data.paymentMethod === "credit"
      ) {
        await customerService.adjustCredit(data.customerId, dueAmount, req);
      }

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async list(req) {
    const filter = { ...ownerFilter(req) };
    const { status, customerId, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      PosSale.find(filter)
        .populate("customerId", "name phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PosSale.countDocuments(filter),
    ]);

    return {
      sales,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  },

  async getById(id, req) {
    return PosSale.findOne({ _id: id, ...ownerFilter(req) })
      .populate("customerId", "name phone email address")
      .populate("soldBy", "username email");
  },

  async refund(saleId, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sale = await PosSale.findOne({
        _id: saleId,
        ...ownerFilter(req),
      }).session(session);

      if (!sale) throw new Error("Sale not found");
      if (sale.status === "refund") throw new Error("Sale already refunded");

      // 1. Restore stock for each item
      for (const item of sale.items) {
        await PosProduct.findByIdAndUpdate(
          item.productId,
          { $inc: { stockQty: item.qty } },
          { session }
        );

        await StockMovement.create(
          [
            {
              orgId: req.orgId || null,
              productId: item.productId,
              type: "IN",
              qty: item.qty,
              reason: `Refund - ${sale.invoiceNo}`,
              refSaleId: sale._id,
              createdBy: req.userId,
            },
          ],
          { session }
        );
      }

      // 2. Update sale status
      sale.status = "refund";
      await sale.save({ session });

      // 3. If credit sale, reverse customer credit
      if (sale.dueAmount > 0 && sale.customerId) {
        await PosCustomer.findByIdAndUpdate(
          sale.customerId,
          { $inc: { creditBalance: -sale.dueAmount } },
          { session }
        );
      }

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getStats(req) {
    const filter = { ...ownerFilter(req), status: { $ne: "refund" } };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalSales, todaySales, totalRevenue, todayRevenue] =
      await Promise.all([
        PosSale.countDocuments(filter),
        PosSale.countDocuments({ ...filter, createdAt: { $gte: today, $lt: tomorrow } }),
        PosSale.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: "$grandTotal" } } },
        ]),
        PosSale.aggregate([
          { $match: { ...filter, createdAt: { $gte: today, $lt: tomorrow } } },
          { $group: { _id: null, total: { $sum: "$grandTotal" } } },
        ]),
      ]);

    return {
      totalSales,
      todaySales,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
    };
  },
};
