import Invoice from "./model.js";
import Customer from "../customers/model.js";
import UserModel from "../../core/models/User.js";
import PDFDocument from "pdfkit";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";

export const getInvoices = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, startDate, endDate } = req.query;

    const filter = req.orgId ? { orgId: req.orgId } : { userId };
    if (status && status !== "all") filter.status = status;
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, { data: invoices });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };
    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }
    return sendSuccess(res, { data: invoice });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getInvoiceStats = async (req, res) => {
  try {
    const userId = req.userId;
    const filter = req.orgId ? { orgId: req.orgId } : { userId };
    const invoices = await Invoice.find(filter);

    const stats = {
      totalInvoices: invoices.length,
      totalRevenue: 0,
      paidCount: 0,
      unpaidCount: 0,
      overdueCount: 0,
      draftCount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
    };

    invoices.forEach((inv) => {
      stats.totalRevenue += inv.grandTotal;
      if (inv.status === "paid") {
        stats.paidCount++;
        stats.paidAmount += inv.grandTotal;
      } else if (inv.status === "overdue") {
        stats.overdueCount++;
        stats.unpaidAmount += inv.grandTotal;
      } else if (inv.status === "draft") {
        stats.draftCount++;
      } else if (inv.status === "sent") {
        stats.unpaidCount++;
        stats.unpaidAmount += inv.grandTotal;
      }
    });

    return sendSuccess(res, { data: stats });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getNextInvoiceNumber = async (req, res) => {
  try {
    const userId = req.userId;
    const numFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const lastInvoice = await Invoice.findOne(numFilter)
      .sort({ createdAt: -1 })
      .select("invoiceNumber");

    let nextNumber = "INV-0001";
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace("INV-", ""));
      nextNumber = `INV-${String(lastNum + 1).padStart(4, "0")}`;
    }

    return sendSuccess(res, { data: { invoiceNumber: nextNumber } });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };
    const {
      customerId, items, overallDiscountType, overallDiscountValue,
      withoutVat, dueDate, paymentMethod, notes, status,
    } = req.body;

    if (!customerId || !items || items.length === 0 || !dueDate) {
      return sendError(res, { status: 400, message: "Customer, items, and due date are required" });
    }

    const customer = await Customer.findOne({ _id: customerId, ...ownerFilter });
    if (!customer) {
      return sendError(res, { status: 404, message: "Customer not found" });
    }

    // Generate invoice number
    const numFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const lastInvoice = await Invoice.findOne(numFilter)
      .sort({ createdAt: -1 })
      .select("invoiceNumber");
    let invoiceNumber = "INV-0001";
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace("INV-", ""));
      invoiceNumber = `INV-${String(lastNum + 1).padStart(4, "0")}`;
    }

    // Calculate each line item
    let subtotal = 0;
    let totalVat = 0;
    let totalItemDiscount = 0;

    const processedItems = items.map((item) => {
      const baseAmount = item.quantity * item.unitPrice;
      const discountAmount =
        item.discountType === "percentage"
          ? baseAmount * ((item.discountValue || 0) / 100)
          : item.discountValue || 0;
      const afterDiscount = baseAmount - discountAmount;
      const vatAmount = withoutVat
        ? 0
        : afterDiscount * ((item.vatRate || 0) / 100);
      const lineTotal = afterDiscount + vatAmount;

      subtotal += baseAmount;
      totalVat += vatAmount;
      totalItemDiscount += discountAmount;

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate || 0,
        vatAmount: Math.round(vatAmount * 100) / 100,
        discountType: item.discountType || "flat",
        discountValue: item.discountValue || 0,
        discountAmount: Math.round(discountAmount * 100) / 100,
        lineTotal: Math.round(lineTotal * 100) / 100,
      };
    });

    // Invoice-level discount
    const afterItems = subtotal - totalItemDiscount + totalVat;
    let overallDiscountAmount = 0;
    if (overallDiscountType === "percentage") {
      overallDiscountAmount = afterItems * ((overallDiscountValue || 0) / 100);
    } else if (overallDiscountType === "flat") {
      overallDiscountAmount = overallDiscountValue || 0;
    }

    const grandTotal = afterItems - overallDiscountAmount;

    const invoice = new Invoice({
      userId,
      orgId: req.orgId,
      invoiceNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerGstin: customer.gstin,
      items: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      totalItemDiscount: Math.round(totalItemDiscount * 100) / 100,
      overallDiscountType: overallDiscountType || "none",
      overallDiscountValue: overallDiscountValue || 0,
      overallDiscountAmount: Math.round(overallDiscountAmount * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      withoutVat: withoutVat || false,
      status: status || "draft",
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      paymentMethod: paymentMethod || "cash",
      notes: notes || "",
    });

    await invoice.save();
    return sendCreated(res, invoice, "Invoice created");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };
    const {
      customerId, items, overallDiscountType, overallDiscountValue,
      withoutVat, dueDate, paymentMethod, notes, status,
    } = req.body;

    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }

    // Recalculate if items changed
    if (items && items.length > 0) {
      let subtotal = 0;
      let totalVat = 0;
      let totalItemDiscount = 0;

      const processedItems = items.map((item) => {
        const baseAmount = item.quantity * item.unitPrice;
        const discountAmount =
          item.discountType === "percentage"
            ? baseAmount * ((item.discountValue || 0) / 100)
            : item.discountValue || 0;
        const afterDiscount = baseAmount - discountAmount;
        const useWithoutVat = withoutVat !== undefined ? withoutVat : invoice.withoutVat;
        const vatAmount = useWithoutVat
          ? 0
          : afterDiscount * ((item.vatRate || 0) / 100);
        const lineTotal = afterDiscount + vatAmount;

        subtotal += baseAmount;
        totalVat += vatAmount;
        totalItemDiscount += discountAmount;

        return {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate || 0,
          vatAmount: Math.round(vatAmount * 100) / 100,
          discountType: item.discountType || "flat",
          discountValue: item.discountValue || 0,
          discountAmount: Math.round(discountAmount * 100) / 100,
          lineTotal: Math.round(lineTotal * 100) / 100,
        };
      });

      const discType = overallDiscountType || invoice.overallDiscountType;
      const discVal = overallDiscountValue !== undefined ? overallDiscountValue : invoice.overallDiscountValue;
      const afterItems = subtotal - totalItemDiscount + totalVat;
      let overallDiscountAmount = 0;
      if (discType === "percentage") {
        overallDiscountAmount = afterItems * ((discVal || 0) / 100);
      } else if (discType === "flat") {
        overallDiscountAmount = discVal || 0;
      }

      invoice.items = processedItems;
      invoice.subtotal = Math.round(subtotal * 100) / 100;
      invoice.totalVat = Math.round(totalVat * 100) / 100;
      invoice.totalItemDiscount = Math.round(totalItemDiscount * 100) / 100;
      invoice.overallDiscountType = discType;
      invoice.overallDiscountValue = discVal;
      invoice.overallDiscountAmount = Math.round(overallDiscountAmount * 100) / 100;
      invoice.grandTotal = Math.round((afterItems - overallDiscountAmount) * 100) / 100;
    }

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, ...ownerFilter });
      if (customer) {
        invoice.customerId = customer._id;
        invoice.customerName = customer.name;
        invoice.customerEmail = customer.email;
        invoice.customerPhone = customer.phone;
        invoice.customerAddress = customer.address;
        invoice.customerGstin = customer.gstin;
      }
    }

    if (withoutVat !== undefined) invoice.withoutVat = withoutVat;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (notes !== undefined) invoice.notes = notes;
    if (status) invoice.status = status;
    if (overallDiscountType) invoice.overallDiscountType = overallDiscountType;
    if (overallDiscountValue !== undefined) invoice.overallDiscountValue = overallDiscountValue;

    await invoice.save();
    return sendSuccess(res, { data: invoice, message: "Invoice updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };

    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
    if (!validStatuses.includes(status)) {
      return sendError(res, { status: 400, message: "Invalid status" });
    }

    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }

    invoice.status = status;
    if (status === "paid") invoice.paidDate = new Date();

    await invoice.save();
    return sendSuccess(res, { data: invoice, message: "Invoice status updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };

    const invoice = await Invoice.findOneAndDelete({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }

    return sendSuccess(res, { message: "Invoice deleted" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const generateInvoicePDF = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };

    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }

    const user = await UserModel.findById(userId).select("username email");

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", 400, 50, { align: "right" });
    doc.fontSize(11).font("Helvetica-Bold").text(user.username || "ThinkBoard", 50, 50);
    doc.fontSize(9).font("Helvetica").text(user.email || "", 50, 65);

    // Invoice details
    const detailsY = 100;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Invoice No:", 370, detailsY);
    doc.font("Helvetica").text(invoice.invoiceNumber, 450, detailsY);
    doc.font("Helvetica-Bold").text("Issue Date:", 370, detailsY + 15);
    doc.font("Helvetica").text(new Date(invoice.issueDate).toLocaleDateString("en-IN"), 450, detailsY + 15);
    doc.font("Helvetica-Bold").text("Due Date:", 370, detailsY + 30);
    doc.font("Helvetica").text(new Date(invoice.dueDate).toLocaleDateString("en-IN"), 450, detailsY + 30);
    doc.font("Helvetica-Bold").text("Status:", 370, detailsY + 45);
    doc.font("Helvetica").text(invoice.status.toUpperCase(), 450, detailsY + 45);

    // Bill To
    doc.font("Helvetica-Bold").fontSize(10).text("Bill To:", 50, detailsY);
    doc.font("Helvetica").fontSize(9);
    doc.text(invoice.customerName, 50, detailsY + 15);
    if (invoice.customerEmail) doc.text(invoice.customerEmail);
    if (invoice.customerPhone) doc.text(invoice.customerPhone);
    const addr = invoice.customerAddress;
    if (addr && addr.street) {
      doc.text([addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", "));
    }
    if (invoice.customerGstin) doc.text(`GSTIN: ${invoice.customerGstin}`);

    // Items table header
    const tableTop = 220;
    doc.rect(45, tableTop - 5, 510, 20).fill("#4f46e5");
    doc.fill("#ffffff").font("Helvetica-Bold").fontSize(8);
    doc.text("Item", 50, tableTop);
    doc.text("Qty", 230, tableTop);
    doc.text("Price", 270, tableTop);
    doc.text("VAT%", 330, tableTop);
    doc.text("Discount", 380, tableTop);
    doc.text("Total", 460, tableTop);

    // Items rows
    doc.fill("#000000").font("Helvetica").fontSize(8);
    let rowY = tableTop + 25;
    invoice.items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.rect(45, rowY - 5, 510, 18).fill("#f9fafb");
        doc.fill("#000000");
      }
      doc.text(item.productName, 50, rowY, { width: 170 });
      doc.text(String(item.quantity), 230, rowY);
      doc.text(`Rs.${item.unitPrice.toLocaleString("en-IN")}`, 270, rowY);
      doc.text(invoice.withoutVat ? "0%" : `${item.vatRate}%`, 330, rowY);
      doc.text(`Rs.${item.discountAmount.toLocaleString("en-IN")}`, 380, rowY);
      doc.text(`Rs.${item.lineTotal.toLocaleString("en-IN")}`, 460, rowY);
      rowY += 20;
    });

    // Line separator
    doc.moveTo(45, rowY + 5).lineTo(555, rowY + 5).stroke("#e5e7eb");

    // Totals
    const totalsX = 370;
    let totalsY = rowY + 15;
    doc.font("Helvetica").fontSize(9);

    doc.text("Subtotal:", totalsX, totalsY);
    doc.text(`Rs.${invoice.subtotal.toLocaleString("en-IN")}`, 470, totalsY);
    totalsY += 18;

    if (invoice.totalItemDiscount > 0) {
      doc.text("Item Discounts:", totalsX, totalsY);
      doc.text(`-Rs.${invoice.totalItemDiscount.toLocaleString("en-IN")}`, 470, totalsY);
      totalsY += 18;
    }

    if (!invoice.withoutVat && invoice.totalVat > 0) {
      doc.text("Total VAT:", totalsX, totalsY);
      doc.text(`Rs.${invoice.totalVat.toLocaleString("en-IN")}`, 470, totalsY);
      totalsY += 18;
    }

    if (invoice.overallDiscountAmount > 0) {
      const label =
        invoice.overallDiscountType === "percentage"
          ? `Overall Discount (${invoice.overallDiscountValue}%):`
          : "Overall Discount:";
      doc.text(label, totalsX, totalsY);
      doc.text(`-Rs.${invoice.overallDiscountAmount.toLocaleString("en-IN")}`, 470, totalsY);
      totalsY += 18;
    }

    // Grand Total
    doc.rect(365, totalsY, 190, 28).fill("#4f46e5");
    doc.fill("#ffffff").font("Helvetica-Bold").fontSize(12);
    doc.text("Grand Total:", 370, totalsY + 7);
    doc.text(`Rs.${invoice.grandTotal.toLocaleString("en-IN")}`, 470, totalsY + 7);

    // Notes
    if (invoice.notes) {
      doc.fill("#000000").font("Helvetica-Bold").fontSize(9).text("Notes:", 50, totalsY + 50);
      doc.font("Helvetica").fontSize(8).text(invoice.notes, 50, totalsY + 65, { width: 300 });
    }

    // Footer
    doc.fill("#888888").font("Helvetica").fontSize(7);
    doc.text("Thank you for your business!", 50, 750, { align: "center", width: 500 });

    doc.end();
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "PDF generation failed" });
  }
};
