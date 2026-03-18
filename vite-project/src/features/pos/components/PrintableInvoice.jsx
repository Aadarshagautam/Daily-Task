import React from "react";
import {
  PAYMENT_METHOD_LABELS,
  TAX_REGISTRATION_LABEL,
  formatDateTimeNepal,
  formatShortCurrencyNpr,
} from "../../../utils/nepal.js";

const formatMoney = (value) => formatShortCurrencyNpr(Number(value || 0));

const getCustomerSnapshot = (sale) => ({
  name: sale.customerName || sale.customerId?.name || "Walk-in customer",
  phone: sale.customerPhone || sale.customerId?.phone || "",
  email: sale.customerEmail || sale.customerId?.email || "",
  address: sale.customerAddressText || sale.customerId?.addressText || "",
  type: sale.customerType || sale.customerId?.customerType || "walk_in",
});

const getPaymentLines = (sale) => {
  if (Array.isArray(sale.payments) && sale.payments.length > 0) {
    return sale.payments;
  }

  if (!sale.paymentMethod) {
    return [];
  }

  return [
    {
      method: sale.paymentMethod,
      label: PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod,
      amount: sale.receivedAmount || sale.paidAmount || sale.grandTotal || 0,
    },
  ];
};

const getPaymentLabel = (payment) =>
  payment.label || PAYMENT_METHOD_LABELS[payment.method] || payment.method || "Cash";

const getPaymentModeLabel = (sale) =>
  sale.paymentMode === "mixed"
    ? "Split payment"
    : PAYMENT_METHOD_LABELS[sale.paymentMode || sale.paymentMethod] ||
      sale.paymentMode ||
      sale.paymentMethod ||
      "Cash";

const getOrderTypeLabel = (value) => {
  if (value === "dine-in") return "Dine-in";
  if (value === "delivery") return "Delivery";
  return "Counter";
};

const formatStatusLabel = (value) => {
  if (!value) return "Completed";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getAddressLine = (address) =>
  [
    address?.street,
    address?.city,
    address?.state,
    address?.pincode,
    address?.country,
  ]
    .filter(Boolean)
    .join(", ");

const getBusinessSnapshot = (organization, currentOrgName, branchName) => ({
  name: organization?.name || currentOrgName || "Your Business",
  branchName: branchName || "",
  phone: organization?.phone || "",
  email: organization?.email || "",
  taxNumber: organization?.gstin || "",
  addressLine: getAddressLine(organization?.address),
});

const getDiscountRows = (sale) => {
  const rows = [
    { label: "Item discount", value: Number(sale.itemDiscountTotal || 0) },
    { label: "Bill discount", value: Number(sale.overallDiscount || 0) },
    { label: "Loyalty discount", value: Number(sale.loyaltyDiscount || 0) },
  ].filter((row) => row.value > 0);

  if (rows.length === 0 && Number(sale.discountTotal || 0) > 0) {
    return [{ label: "Discount", value: Number(sale.discountTotal || 0) }];
  }

  return rows;
};

const DetailRow = ({ label, value, emphasized = false }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`text-right ${emphasized ? "font-semibold text-slate-900" : "text-slate-700"}`}>
      {value}
    </span>
  </div>
);

const TotalRow = ({ label, value, tone = "default", strong = false }) => {
  const colorClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-rose-600"
          : "text-slate-900";

  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-bold" : "text-sm"}`}>
      <span className={strong ? "text-slate-900" : "text-slate-500"}>{label}</span>
      <span className={`tabular-nums ${colorClass}`}>{value}</span>
    </div>
  );
};

const PrintableInvoice = ({
  sale,
  organization,
  currentOrgName,
  branchName,
  operatorName,
}) => {
  if (!sale) return null;

  const items = Array.isArray(sale.items) ? sale.items : [];
  const customer = getCustomerSnapshot(sale);
  const paymentLines = getPaymentLines(sale);
  const business = getBusinessSnapshot(organization, currentOrgName, branchName);
  const paymentModeLabel = getPaymentModeLabel(sale);
  const discountRows = getDiscountRows(sale);
  const isWalkIn = customer.type === "walk_in" && !sale.customerId;
  const taxLabel = Number(sale.taxTotal || 0) > 0 || business.taxNumber ? "VAT" : "Tax";
  const operatorLabel = sale.orderType === "dine-in" ? "Served by" : "Cashier";
  const receiptTitle = sale.status === "refund" ? "Refund receipt" : "Sales receipt";

  return (
    <>
      <style>
        {`
          @page {
            size: 80mm auto;
            margin: 6mm;
          }

          @media print {
            body {
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .receipt-print-shell {
              width: 100%;
              margin: 0;
              padding: 0;
            }
          }
        `}
      </style>

      <div className="receipt-print-shell">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:hidden">
          <div className="border-b border-slate-200 pb-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Nepal-ready billing receipt
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">{business.name}</h1>
            {business.branchName ? (
              <p className="mt-2 text-sm font-medium text-amber-700">{business.branchName}</p>
            ) : null}
            {business.addressLine ? (
              <p className="mt-2 text-sm text-slate-600">{business.addressLine}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-600">
              {business.phone ? <span>{business.phone}</span> : null}
              {business.email ? <span>{business.email}</span> : null}
              {business.taxNumber ? <span>{TAX_REGISTRATION_LABEL}: {business.taxNumber}</span> : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Bill details
              </p>
              <div className="mt-4 space-y-3">
                <DetailRow label="Receipt" value={sale.invoiceNo || "Receipt"} emphasized />
                <DetailRow label="Date & time" value={formatDateTimeNepal(sale.createdAt)} />
                <DetailRow label="Service" value={getOrderTypeLabel(sale.orderType)} />
                <DetailRow label="Status" value={formatStatusLabel(sale.status)} />
                {sale.tableNumber ? <DetailRow label="Table" value={`#${sale.tableNumber}`} /> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Customer & settlement
              </p>
              <div className="mt-4 space-y-3">
                <DetailRow label="Customer" value={customer.name} emphasized />
                {customer.phone ? <DetailRow label="Phone" value={customer.phone} /> : null}
                <DetailRow label="Payment" value={paymentModeLabel} />
                <DetailRow label={operatorLabel} value={operatorName || "Operator"} />
                {!isWalkIn && customer.address ? (
                  <DetailRow label="Address" value={customer.address} />
                ) : null}
              </div>
            </section>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1.8fr)_80px_110px_110px] gap-3 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <div
                  key={`${item.productId || item.nameSnapshot}-${index}`}
                  className="grid grid-cols-[minmax(0,1.8fr)_80px_110px_110px] gap-3 px-5 py-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.nameSnapshot}</p>
                    {item.skuSnapshot ? <p className="mt-1 text-xs text-slate-400">{item.skuSnapshot}</p> : null}
                    {item.modifiers?.length > 0 ? (
                      <p className="mt-1 text-xs text-amber-700">
                        {item.modifiers.map((modifier) => modifier.option).join(", ")}
                      </p>
                    ) : null}
                    {item.notes ? <p className="mt-1 text-xs italic text-rose-500">{item.notes}</p> : null}
                  </div>
                  <div className="text-right font-medium tabular-nums text-slate-700">{item.qty}</div>
                  <div className="text-right tabular-nums text-slate-700">
                    <p>{formatMoney(item.price)}</p>
                    {item.discount > 0 ? (
                      <p className="mt-1 text-xs text-rose-500">Disc. {formatMoney(item.discount)}</p>
                    ) : null}
                    {item.tax > 0 ? (
                      <p className="mt-1 text-xs text-slate-400">{taxLabel} {formatMoney(item.tax)}</p>
                    ) : null}
                  </div>
                  <div className="text-right font-semibold tabular-nums text-slate-900">
                    {formatMoney(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
            <section className="rounded-3xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Payment summary
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <DetailRow label="Primary method" value={paymentModeLabel} />
                <DetailRow label="Received" value={formatMoney(sale.receivedAmount || sale.paidAmount)} />
                {paymentLines.length > 1
                  ? paymentLines.map((payment, index) => (
                      <DetailRow
                        key={`${payment.method}-${index}`}
                        label={getPaymentLabel(payment)}
                        value={formatMoney(payment.amount)}
                      />
                    ))
                  : null}
                <DetailRow label={operatorLabel} value={operatorName || "Operator"} />
                {sale.notes ? <DetailRow label="Note" value={sale.notes} /> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Totals
              </p>
              <div className="mt-4 space-y-3">
                <TotalRow label="Subtotal" value={formatMoney(sale.subTotal)} />
                {discountRows.map((row) => (
                  <TotalRow
                    key={row.label}
                    label={row.label}
                    value={`- ${formatMoney(row.value)}`}
                    tone="danger"
                  />
                ))}
                <TotalRow label={taxLabel} value={formatMoney(sale.taxTotal)} />
                <div className="border-t border-white/15 pt-3">
                  <TotalRow label="Grand total" value={formatMoney(sale.grandTotal)} strong />
                </div>
                <TotalRow label="Paid" value={formatMoney(sale.paidAmount)} tone="success" />
                {sale.changeAmount > 0 ? (
                  <TotalRow label="Change" value={formatMoney(sale.changeAmount)} tone="success" />
                ) : null}
                {sale.dueAmount > 0 ? (
                  <TotalRow label="Due" value={formatMoney(sale.dueAmount)} tone="warning" />
                ) : null}
              </div>
            </section>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-700">
              {sale.status === "refund" ? "Refund processed for this bill." : "Thank you for your business."}
            </p>
            <p className="mt-1">Please keep this receipt for your record.</p>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-[76mm] font-mono text-[11px] leading-5 text-slate-950 print:block">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {receiptTitle}
            </p>
            <p className="mt-1 text-sm font-bold">{business.name}</p>
            {business.branchName ? <p>{business.branchName}</p> : null}
            {business.addressLine ? <p className="whitespace-normal break-words">{business.addressLine}</p> : null}
            {business.phone ? <p>{business.phone}</p> : null}
            {business.taxNumber ? <p>{TAX_REGISTRATION_LABEL}: {business.taxNumber}</p> : null}
          </div>

          <div className="mt-3 border-y border-dashed border-slate-400 py-2">
            <div className="flex items-start justify-between gap-4">
              <span>Bill no</span>
              <span className="text-right">{sale.invoiceNo || "Receipt"}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>Date</span>
              <span className="text-right">{formatDateTimeNepal(sale.createdAt)}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>Service</span>
              <span className="text-right">{getOrderTypeLabel(sale.orderType)}</span>
            </div>
            {sale.tableNumber ? (
              <div className="flex items-start justify-between gap-4">
                <span>Table</span>
                <span className="text-right">#{sale.tableNumber}</span>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-4">
              <span>Customer</span>
              <span className="text-right">{customer.name}</span>
            </div>
            {customer.phone ? (
              <div className="flex items-start justify-between gap-4">
                <span>Phone</span>
                <span className="text-right">{customer.phone}</span>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-4">
              <span>Payment</span>
              <span className="text-right">{paymentModeLabel}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>{operatorLabel}</span>
              <span className="text-right">{operatorName || "Operator"}</span>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {items.map((item, index) => (
              <div key={`${item.productId || item.nameSnapshot}-${index}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="max-w-[68%] whitespace-normal break-words font-semibold">
                    {item.nameSnapshot}
                  </span>
                  <span className="text-right font-semibold">{formatMoney(item.lineTotal)}</span>
                </div>
                <div className="text-[10px] text-slate-600">
                  {item.qty} x {formatMoney(item.price)}
                </div>
                {item.modifiers?.length > 0 ? (
                  <div className="text-[10px] text-slate-600">
                    {item.modifiers.map((modifier) => modifier.option).join(", ")}
                  </div>
                ) : null}
                {item.notes ? <div className="text-[10px] italic text-slate-600">{item.notes}</div> : null}
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1 border-y border-dashed border-slate-400 py-2">
            <div className="flex items-start justify-between gap-4">
              <span>Subtotal</span>
              <span>{formatMoney(sale.subTotal)}</span>
            </div>
            {discountRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <span>{row.label}</span>
                <span>- {formatMoney(row.value)}</span>
              </div>
            ))}
            <div className="flex items-start justify-between gap-4">
              <span>{taxLabel}</span>
              <span>{formatMoney(sale.taxTotal)}</span>
            </div>
            <div className="mt-1 flex items-start justify-between gap-4 border-t border-dashed border-slate-400 pt-1 font-bold">
              <span>TOTAL</span>
              <span>{formatMoney(sale.grandTotal)}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>Paid</span>
              <span>{formatMoney(sale.paidAmount)}</span>
            </div>
            {sale.changeAmount > 0 ? (
              <div className="flex items-start justify-between gap-4">
                <span>Change</span>
                <span>{formatMoney(sale.changeAmount)}</span>
              </div>
            ) : null}
            {sale.dueAmount > 0 ? (
              <div className="flex items-start justify-between gap-4">
                <span>Due</span>
                <span>{formatMoney(sale.dueAmount)}</span>
              </div>
            ) : null}
          </div>

          {paymentLines.length > 1 ? (
            <div className="mt-3 border-b border-dashed border-slate-400 pb-2">
              {paymentLines.map((payment, index) => (
                <div key={`${payment.method}-${index}`} className="flex items-start justify-between gap-4">
                  <span>{getPaymentLabel(payment)}</span>
                  <span>{formatMoney(payment.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {sale.notes ? (
            <div className="mt-3">
              <p className="font-semibold">Note</p>
              <p className="whitespace-normal break-words">{sale.notes}</p>
            </div>
          ) : null}

          <div className="mt-4 text-center">
            <p>{sale.status === "refund" ? "Refund completed" : "Thank you for visiting"}</p>
            <p className="text-[10px] text-slate-500">Please keep this bill for record.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintableInvoice;
