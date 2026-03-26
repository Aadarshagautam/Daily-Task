import Shift from "../models/Shift.js";
import PosSale from "../models/Sale.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";

const SHIFT_PAYMENT_METHOD_KEYS = [
  "cash",
  "card",
  "bank_transfer",
  "esewa",
  "khalti",
  "credit",
  "mixed",
];

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const createEmptyPaymentTotals = () => ({
  cash: 0,
  card: 0,
  bank_transfer: 0,
  esewa: 0,
  khalti: 0,
  credit: 0,
  mixed: 0,
});

const addPaymentTotal = (totals, method, amount) => {
  if (!SHIFT_PAYMENT_METHOD_KEYS.includes(method)) return;
  totals[method] = roundMoney((totals[method] || 0) + (Number(amount) || 0));
};

const buildShiftSalesSummary = ({ openingCash = 0, sales = [] } = {}) => {
  const salesByMethod = createEmptyPaymentTotals();
  let totalSales = 0;
  let totalTransactions = 0;
  let changeTotal = 0;

  sales.forEach((sale) => {
    totalTransactions += 1;
    totalSales += Number(sale?.grandTotal) || 0;
    changeTotal += Number(sale?.changeAmount) || 0;

    const paymentLines = Array.isArray(sale?.payments) ? sale.payments : [];
    const paymentMode = String(sale?.paymentMode || sale?.paymentMethod || "cash").trim();

    if (paymentLines.length > 0) {
      paymentLines.forEach((payment) => {
        const method = String(payment?.method || payment?.paymentMethod || "").trim();
        addPaymentTotal(salesByMethod, method, payment?.amount);
      });

      if (paymentMode === "mixed") {
        addPaymentTotal(salesByMethod, "mixed", sale?.paidAmount);
      }
    } else {
      addPaymentTotal(salesByMethod, paymentMode || "cash", sale?.paidAmount);
    }

    if ((Number(sale?.dueAmount) || 0) > 0) {
      addPaymentTotal(salesByMethod, "credit", sale?.dueAmount);
    }
  });

  const cashSales = roundMoney(salesByMethod.cash);
  const digitalTotal = roundMoney(
    (salesByMethod.card || 0) +
      (salesByMethod.bank_transfer || 0) +
      (salesByMethod.esewa || 0) +
      (salesByMethod.khalti || 0)
  );
  const dueTotal = roundMoney(salesByMethod.credit);
  const collectedTotal = roundMoney(cashSales + digitalTotal);
  const expectedCash = roundMoney((Number(openingCash) || 0) + cashSales);

  return {
    totalSales: roundMoney(totalSales),
    totalTransactions,
    expectedCash,
    salesByMethod,
    cashSales,
    digitalTotal,
    dueTotal,
    collectedTotal,
    changeTotal: roundMoney(changeTotal),
  };
};

const loadShiftSalesSummary = async (shift, req) => {
  const sales = await PosSale.find({
    shiftId: shift._id,
    status: { $ne: "refund" },
    ...buildPosScopeFilter(req),
  })
    .select("grandTotal paidAmount dueAmount changeAmount paymentMethod paymentMode payments")
    .lean();

  return buildShiftSalesSummary({
    openingCash: shift.openingCash,
    sales,
  });
};

const attachShiftSummary = async (shift, req) => {
  if (!shift) return null;

  const summary = await loadShiftSalesSummary(shift, req);
  const baseShift = typeof shift.toObject === "function" ? shift.toObject() : shift;
  const physicalCash =
    baseShift.status === "closed"
      ? roundMoney(baseShift.closingCash ?? summary.expectedCash)
      : summary.expectedCash;

  return {
    ...baseShift,
    totalSales: summary.totalSales,
    totalTransactions: summary.totalTransactions,
    expectedCash: summary.expectedCash,
    salesByMethod: summary.salesByMethod,
    cashSales: summary.cashSales,
    digitalTotal: summary.digitalTotal,
    dueTotal: summary.dueTotal,
    collectedTotal: summary.collectedTotal,
    changeTotal: summary.changeTotal,
    handoverTotal: roundMoney(physicalCash + summary.digitalTotal),
  };
};

export const shiftService = {
  async getCurrentShift(req) {
    const shift = await Shift.findOne({ ...buildPosScopeFilter(req), status: "open" })
      .populate("openedBy", "username")
      .sort({ createdAt: -1 });

    return attachShiftSummary(shift, req);
  },

  async open(data, req) {
    // Only one shift open at a time
    const existing = await Shift.findOne({ ...buildPosScopeFilter(req), status: "open" });
    if (existing) throw new Error("A shift is already open. Close it first.");

    return Shift.create({
      userId: req.userId,
      orgId: req.orgId || null,
      branchId: getPosBranchId(req),
      openedBy: req.userId,
      openingCash: data.openingCash || 0,
      notes: data.notes || "",
      status: "open",
    });
  },

  async close(shiftId, data, req) {
    const shift = await Shift.findOne({ _id: shiftId, ...buildPosScopeFilter(req), status: "open" });
    if (!shift) throw new Error("Open shift not found.");

    const summary = await loadShiftSalesSummary(shift, req);
    const expectedCash = summary.expectedCash;
    const closingCash =
      data.closingCash === undefined || data.closingCash === null
        ? expectedCash
        : roundMoney(data.closingCash);
    const cashDifference = roundMoney(closingCash - expectedCash);

    return Shift.findByIdAndUpdate(
      shiftId,
      {
        $set: {
          status: "closed",
          closedBy: req.userId,
          closedAt: new Date(),
          closingCash,
          expectedCash,
          cashDifference,
          totalSales: summary.totalSales,
          totalTransactions: summary.totalTransactions,
          salesByMethod: summary.salesByMethod,
          notes: data.notes || shift.notes,
        },
      },
      { new: true }
    ).populate("openedBy closedBy", "username");
  },

  async list(req) {
    return Shift.find(buildPosScopeFilter(req))
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("openedBy closedBy", "username");
  },

  async getById(id, req) {
    const shift = await Shift.findOne({ _id: id, ...buildPosScopeFilter(req) }).populate(
      "openedBy closedBy",
      "username"
    );

    if (!shift) return null;
    if (shift.status === "open") {
      return attachShiftSummary(shift, req);
    }

    return shift;
  },
};
