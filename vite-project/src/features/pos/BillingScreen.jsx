import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  UserPlus,
  X,
  Check,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { posProductApi, posCustomerApi, posSaleApi } from "../../api/posApi";
import PrintableInvoice from "./components/PrintableInvoice";

const BillingScreen = () => {
  const queryClient = useQueryClient();
  const searchRef = useRef(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [notes, setNotes] = useState("");

  // Product search
  const { data: productData } = useQuery({
    queryKey: ["pos-products-billing", search],
    queryFn: () => posProductApi.list({ search, limit: 10 }),
    enabled: search.length > 0,
  });
  const searchResults = productData?.data?.products || [];

  // Customer search
  const { data: customerData } = useQuery({
    queryKey: ["pos-customers-billing", customerSearch],
    queryFn: () => posCustomerApi.list({ search: customerSearch }),
    enabled: customerSearch.length > 0,
  });
  const customerResults = customerData?.data || [];

  // Sale mutation
  const saleMut = useMutation({
    mutationFn: (data) => posSaleApi.create(data),
    onSuccess: (res) => {
      toast.success("Sale completed!");
      setCompletedSale(res.data);
      setCart([]);
      setOverallDiscount(0);
      setPaidAmount("");
      setSelectedCustomer(null);
      setNotes("");
      setSearch("");
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-stats"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Sale failed"),
  });

  // Focus search on mount
  useEffect(() => { searchRef.current?.focus(); }, []);

  // ─── Cart helpers ───
  const addToCart = (product) => {
    setSearch("");
    const existing = cart.find((c) => c.productId === product._id);
    if (existing) {
      setCart(cart.map((c) =>
        c.productId === product._id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku || "",
          price: product.sellingPrice,
          taxRate: product.taxRate,
          qty: 1,
          discount: 0,
          stockQty: product.stockQty,
        },
      ]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map((c) => {
      if (c.productId === productId) {
        const newQty = c.qty + delta;
        return newQty <= 0 ? null : { ...c, qty: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const updateLineDiscount = (productId, discount) => {
    setCart(cart.map((c) =>
      c.productId === productId ? { ...c, discount: Math.max(0, Number(discount) || 0) } : c
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((c) => c.productId !== productId));
  };

  // ─── Totals ───
  const subTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const lineDiscounts = cart.reduce((s, c) => s + c.discount, 0);
  const taxableBase = subTotal - lineDiscounts - overallDiscount;
  const taxTotal = cart.reduce((s, c) => {
    const lineNet = c.price * c.qty - c.discount;
    return s + (lineNet * c.taxRate) / 100;
  }, 0);
  const grandTotal = Math.round((taxableBase + taxTotal) * 100) / 100;
  const paid = paidAmount === "" ? grandTotal : Number(paidAmount);
  const change = paid - grandTotal;

  // ─── Checkout ───
  const handleCheckout = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (paid < 0) return toast.error("Invalid payment amount");

    saleMut.mutate({
      items: cart.map((c) => ({
        productId: c.productId,
        qty: c.qty,
        price: c.price,
        discount: c.discount,
      })),
      paymentMethod,
      paidAmount: paid,
      customerId: selectedCustomer?._id || null,
      overallDiscount,
      notes,
    });
  };

  // ─── Print completed invoice ───
  if (completedSale) {
    return (
      <div className="p-4 lg:pl-[17.5rem] pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Sale Completed</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> New Sale
              </button>
            </div>
          </div>
          <PrintableInvoice sale={completedSale} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">POS Billing</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Product search + Cart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Product Search */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search product by name, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Search Results */}
              {search && searchResults.length > 0 && (
                <div className="mt-2 border border-slate-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.sku || "No SKU"} | Stock: {p.stockQty}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">Rs. {p.sellingPrice}</p>
                        <p className="text-xs text-slate-400">+{p.taxRate}% tax</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Cart ({cart.length} items)
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-sm">Search and add products to cart</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-2 font-medium text-slate-600">Product</th>
                        <th className="text-center px-4 py-2 font-medium text-slate-600">Qty</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">Price</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">Discount</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">Tax</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">Total</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map((c) => {
                        const lineNet = c.price * c.qty - c.discount;
                        const lineTax = (lineNet * c.taxRate) / 100;
                        const lineTotal = lineNet + lineTax;
                        return (
                          <tr key={c.productId} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{c.name}</p>
                              <p className="text-xs text-slate-400">{c.sku}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateQty(c.productId, -1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-medium">{c.qty}</span>
                                <button
                                  onClick={() => updateQty(c.productId, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">Rs. {c.price}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={c.discount}
                                onChange={(e) => updateLineDiscount(c.productId, e.target.value)}
                                className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              Rs. {lineTax.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              Rs. {lineTotal.toFixed(2)}
                            </td>
                            <td className="px-2 py-3">
                              <button
                                onClick={() => removeFromCart(c.productId)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Payment panel */}
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Customer (optional)</h3>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-600">{selectedCustomer.phone || "No phone"}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-slate-100 rounded">
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  {showCustomerDropdown && customerSearch && customerResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                            setShowCustomerDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                        >
                          <span className="font-medium">{c.name}</span>
                          {c.phone && <span className="text-slate-400 ml-2">{c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">Rs. {subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Line Discounts</span>
                <span className="text-red-600">- Rs. {lineDiscounts.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Overall Discount</span>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax (VAT)</span>
                <span className="font-medium">Rs. {taxTotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-slate-600">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "cash", label: "Cash", icon: Banknote },
                  { key: "card", label: "Card", icon: CreditCard },
                  { key: "upi", label: "UPI", icon: Smartphone },
                  { key: "credit", label: "Credit", icon: UserPlus },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      paymentMethod === key
                        ? "border-slate-500 bg-slate-50 text-slate-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Paid Amount */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Paid Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={grandTotal.toFixed(2)}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                {paid >= grandTotal && paid > 0 && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Change: Rs. {change.toFixed(2)}
                  </p>
                )}
                {paid < grandTotal && paid >= 0 && paidAmount !== "" && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">
                    Due: Rs. {(grandTotal - paid).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || saleMut.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saleMut.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {saleMut.isPending ? "Processing..." : `Checkout - Rs. ${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingScreen;
