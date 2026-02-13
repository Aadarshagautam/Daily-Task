import React from "react";

const PrintableInvoice = ({ sale }) => {
  if (!sale) return null;

  const customer = sale.customerId;
  const date = new Date(sale.createdAt).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* A4 Invoice */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 print:border-0 print:shadow-none print:p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 print:mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 print:text-xl">INVOICE</h1>
            <p className="text-sm text-slate-500 mt-1">{sale.invoiceNo}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">{date}</p>
            <p className="text-xs text-slate-400 mt-1">
              Status:{" "}
              <span
                className={`font-medium ${
                  sale.status === "paid"
                    ? "text-green-600"
                    : sale.status === "refund"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {sale.status.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg print:bg-transparent print:border print:border-slate-300 print:p-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Bill To</p>
            <p className="text-sm font-medium text-slate-900">{customer.name}</p>
            {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
            {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
            {customer.address && <p className="text-sm text-slate-600">{customer.address}</p>}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 font-medium text-slate-600">#</th>
              <th className="text-left py-2 font-medium text-slate-600">Item</th>
              <th className="text-right py-2 font-medium text-slate-600">Qty</th>
              <th className="text-right py-2 font-medium text-slate-600">Price</th>
              <th className="text-right py-2 font-medium text-slate-600">Disc.</th>
              <th className="text-right py-2 font-medium text-slate-600">Tax</th>
              <th className="text-right py-2 font-medium text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((item, i) => (
              <tr key={i}>
                <td className="py-2 text-slate-500">{i + 1}</td>
                <td className="py-2">
                  <p className="font-medium text-slate-900">{item.nameSnapshot}</p>
                  {item.skuSnapshot && (
                    <p className="text-xs text-slate-400">{item.skuSnapshot}</p>
                  )}
                </td>
                <td className="py-2 text-right">{item.qty}</td>
                <td className="py-2 text-right">Rs. {item.price.toFixed(2)}</td>
                <td className="py-2 text-right text-red-600">
                  {item.discount > 0 ? `Rs. ${item.discount.toFixed(2)}` : "-"}
                </td>
                <td className="py-2 text-right">Rs. {item.tax.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">Rs. {item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-slate-200 pt-4 ml-auto max-w-xs">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Subtotal</span>
            <span>Rs. {sale.subTotal.toFixed(2)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Discount</span>
              <span className="text-red-600">- Rs. {sale.discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Tax (VAT)</span>
            <span>Rs. {sale.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-slate-200">
            <span>Grand Total</span>
            <span>Rs. {sale.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-slate-600">Paid</span>
            <span className="text-green-600 font-medium">Rs. {sale.paidAmount.toFixed(2)}</span>
          </div>
          {sale.dueAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Due</span>
              <span className="text-red-600 font-medium">Rs. {sale.dueAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Payment & Notes */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500">
          <p>Payment: {sale.paymentMethod.toUpperCase()}</p>
          {sale.notes && <p>Notes: {sale.notes}</p>}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>Thank you for your purchase!</p>
        </div>
      </div>

      {/* 80mm Receipt (print only) */}
      <div className="hidden print:block mt-8 page-break-before">
        <div className="max-w-[80mm] mx-auto text-xs font-mono">
          <div className="text-center mb-2">
            <p className="font-bold text-sm">RECEIPT</p>
            <p>{sale.invoiceNo}</p>
            <p>{date}</p>
          </div>
          <hr className="border-dashed my-2" />
          {customer && (
            <>
              <p>Customer: {customer.name}</p>
              {customer.phone && <p>Phone: {customer.phone}</p>}
              <hr className="border-dashed my-2" />
            </>
          )}
          {sale.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="truncate max-w-[55%]">
                {item.qty}x {item.nameSnapshot}
              </span>
              <span>Rs.{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          <hr className="border-dashed my-2" />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs.{sale.subTotal.toFixed(2)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-Rs.{sale.discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>Rs.{sale.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold mt-1 pt-1 border-t border-dashed">
            <span>TOTAL</span>
            <span>Rs.{sale.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Paid ({sale.paymentMethod})</span>
            <span>Rs.{sale.paidAmount.toFixed(2)}</span>
          </div>
          {sale.dueAmount > 0 && (
            <div className="flex justify-between">
              <span>Due</span>
              <span>Rs.{sale.dueAmount.toFixed(2)}</span>
            </div>
          )}
          <hr className="border-dashed my-2" />
          <p className="text-center">Thank you!</p>
        </div>
      </div>
    </>
  );
};

export default PrintableInvoice;
