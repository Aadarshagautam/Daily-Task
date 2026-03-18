import React, { useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  Bike,
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  Minus,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Printer,
  RotateCcw,
  ShoppingCart,
  Smartphone,
  Star,
  Table2,
  Trash2,
  UserPlus,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { posCustomerApi, posProductApi, posSaleApi, posShiftApi, posTableApi } from "../../api/posApi";
import { EmptyCard, PageHeader, SearchField, WorkspacePage } from "../../components/ui/ErpPrimitives.jsx";
import { getBusinessPosMeta } from "../../config/businessConfigs.js";
import AppContext from "../../context/app-context.js";
import {
  PAYMENT_METHOD_LABELS,
  POS_PAYMENT_METHODS,
  formatDateTimeNepal,
  formatShortCurrencyNpr,
} from "../../utils/nepal.js";
import PrintableInvoice from "./components/PrintableInvoice";
import {
  buildPosSalePayload,
  buildQuickTenderValues,
  calculateCartTotals,
  calculateTenderState,
  createHeldBillSnapshot,
  findExactProductMatch,
  getCheckoutIssues,
  readHeldBills,
  removeHeldBill,
  saveHeldBill,
} from "./utils/billing.js";

const ORDER_TYPES = {
  "dine-in": { key: "dine-in", label: "Dine-in", icon: Utensils },
  takeaway: { key: "takeaway", label: "Takeaway", icon: Package },
  delivery: { key: "delivery", label: "Delivery", icon: Bike },
};

const PAYMENT_METHOD_ICONS = {
  cash: Banknote,
  card: CreditCard,
  bank_transfer: Landmark,
  esewa: Smartphone,
  khalti: Smartphone,
  credit: Wallet,
};

const PILL_TONES = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  teal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
};

const PAYMENT_TONES = {
  cash: "border-emerald-200 bg-emerald-50 text-emerald-700",
  card: "border-sky-200 bg-sky-50 text-sky-700",
  bank_transfer: "border-indigo-200 bg-indigo-50 text-indigo-700",
  esewa: "border-lime-200 bg-lime-50 text-lime-700",
  khalti: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  credit: "border-amber-200 bg-amber-50 text-amber-700",
};

const buildQuickCustomerSeed = (value = "") => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D+/g, "");
  const hasLetters = /[A-Za-z]/.test(trimmed);

  if (!trimmed) return { name: "", phone: "" };
  if (!hasLetters && digits.length >= 7) return { name: "", phone: trimmed };
  return { name: trimmed, phone: "" };
};

const isProductSellable = (product) => {
  if (!product?.isAvailable) return false;
  const usesRecipe = Array.isArray(product.recipe) && product.recipe.length > 0;
  if (product.trackStock === false || usesRecipe) return true;
  return Number(product.stockQty || 0) > 0;
};

function InfoPill({ icon: Icon, tone = "slate", children }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${PILL_TONES[tone] || PILL_TONES.slate}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

function ProductListRow({ product, onClick }) {
  const sellable = isProductSellable(product);

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      disabled={!sellable}
      className={`flex w-full items-center justify-between gap-4 rounded-3xl border p-4 text-left transition ${
        sellable
          ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {product.barcode || product.sku || "No code"}
              {" / "}
              {product.trackStock === false || (Array.isArray(product.recipe) && product.recipe.length > 0)
                ? "Ready to bill"
                : `Stock ${product.stockQty}`}
            </p>
          </div>
          {product.modifiers?.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
              <Star className="h-3 w-3 fill-current" />
              Options
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-bold text-slate-900">{formatShortCurrencyNpr(product.sellingPrice)}</p>
        <p className="mt-1 text-xs text-slate-500">VAT {Number(product.taxRate || 0)}%</p>
      </div>
    </button>
  );
}

function ProductTile({ product, onClick }) {
  const sellable = isProductSellable(product);

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      disabled={!sellable}
      className={`relative rounded-3xl border p-4 text-left transition ${
        sellable
          ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
      }`}
    >
      {product.modifiers?.length > 0 ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
          <Star className="h-3 w-3 fill-current" />
          Custom
        </span>
      ) : null}
      <div className="pr-14">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{product.name}</p>
        <p className="mt-3 text-lg font-bold text-slate-900">{formatShortCurrencyNpr(product.sellingPrice)}</p>
        <p className="mt-2 text-xs text-slate-500">
          {product.trackStock === false || (Array.isArray(product.recipe) && product.recipe.length > 0)
            ? "Ready to bill"
            : `Stock ${product.stockQty}`}
        </p>
      </div>
    </button>
  );
}

function HeldBillCard({ bill, onResume, onRemove }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{bill.summary?.customerName || "Walk-in Customer"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {bill.summary?.itemCount || 0} items / {formatShortCurrencyNpr(bill.summary?.grandTotal || 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Held {bill.heldAt ? formatDateTimeNepal(bill.heldAt) : "recently"}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {ORDER_TYPES[bill.orderType]?.label || bill.orderType || "Bill"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onResume} className="btn-primary justify-center">
          <PlayCircle className="h-4 w-4" />
          Resume
        </button>
        <button type="button" onClick={onRemove} className="btn-secondary justify-center">
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  );
}

function CartLine({ item, onDecrease, onIncrease, onQtyChange, onDiscountChange, onRemove }) {
  const lineSubtotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
  const lineDiscount = Number(item.discount) || 0;
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
          {item.modifiers?.length > 0 ? <p className="mt-1 text-xs text-indigo-600">{item.modifiers.map((modifier) => modifier.option).join(", ")}</p> : null}
          {item.notes ? <p className="mt-1 text-xs italic text-rose-600">{item.notes}</p> : null}
          <p className="mt-1 text-xs text-slate-500">
            {formatShortCurrencyNpr(item.price)} each / VAT {Number(item.taxRate || 0)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{formatShortCurrencyNpr(lineTotal)}</p>
          {lineDiscount > 0 ? <p className="mt-1 text-[11px] text-rose-600">Disc. {formatShortCurrencyNpr(lineDiscount)}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDecrease} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min="1"
            value={item.qty}
            onChange={(event) => onQtyChange(event.target.value)}
            className="h-10 w-16 rounded-2xl border border-slate-200 bg-slate-50 px-2 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button type="button" onClick={onIncrease} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">
            Discount
            <input
              type="number"
              min="0"
              value={item.discount}
              onChange={(event) => onDiscountChange(event.target.value)}
              className="ml-2 h-10 w-24 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <button type="button" onClick={onRemove} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodButton({ method, active, onClick }) {
  const Icon = PAYMENT_METHOD_ICONS[method.key] || CreditCard;
  const toneClass = PAYMENT_TONES[method.key] || PILL_TONES.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border px-3 py-3 text-left transition ${
        active ? toneClass : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? "bg-white/80" : "bg-slate-100"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{method.label}</p>
          <p className="text-[11px] opacity-75">{method.key === "credit" ? "Save as due" : "Take payment"}</p>
        </div>
      </div>
    </button>
  );
}

function ModifierModal({ product, onConfirm, onClose }) {
  const [selections, setSelections] = useState({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const toggleOption = (modifierName, option, multiSelect) => {
    setSelections((previous) => {
      const current = previous[modifierName] || [];
      if (multiSelect) {
        return current.includes(option.label)
          ? { ...previous, [modifierName]: current.filter((label) => label !== option.label) }
          : { ...previous, [modifierName]: [...current, option.label] };
      }
      return { ...previous, [modifierName]: [option.label] };
    });
  };

  const extraPrice =
    product.modifiers?.reduce((sum, modifier) => {
      const selectedOptions = selections[modifier.name] || [];
      return sum + modifier.options.filter((option) => selectedOptions.includes(option.label)).reduce((optionSum, option) => optionSum + option.price, 0);
    }, 0) || 0;

  const confirm = () => {
    const modifiers = [];
    for (const [name, options] of Object.entries(selections)) {
      options.forEach((optionLabel) => {
        const modifier = product.modifiers.find((item) => item.name === name);
        const option = modifier?.options.find((item) => item.label === optionLabel);
        modifiers.push({ name, option: optionLabel, price: option?.price || 0 });
      });
    }
    onConfirm({ qty, modifiers, notes: note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">{product.name}</h3>
            <p className="text-sm text-slate-500">{formatShortCurrencyNpr(product.sellingPrice + extraPrice)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Quantity</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-xl font-bold text-slate-900">{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {product.modifiers?.map((modifier) => (
            <div key={modifier.name}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {modifier.name}
                {modifier.required ? <span className="ml-1 text-rose-500">*</span> : null}
              </label>
              <div className="flex flex-wrap gap-2">
                {modifier.options.map((option) => {
                  const selected = (selections[modifier.name] || []).includes(option.label);

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => toggleOption(modifier.name, option, modifier.multiSelect)}
                      className={`rounded-2xl border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                      {option.price > 0 ? <span className="ml-1 text-xs opacity-75">+{option.price}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Special note</label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="No onion, extra spicy, less sugar..."
              className="input-primary"
            />
          </div>
        </div>

        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="btn-secondary justify-center">
            Cancel
          </button>
          <button type="button" onClick={confirm} className="btn-primary justify-center">
            Add to bill
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingScreen() {
  const { branchName, orgBusinessType } = useContext(AppContext);
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchRef = useRef(null);
  const checkoutIntentRef = useRef("pay");
  const routeTableSeedRef = useRef("");
  const posMeta = getBusinessPosMeta(orgBusinessType);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("takeaway");
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "" });
  const [heldBills, setHeldBills] = useState(() => readHeldBills());
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [completedSale, setCompletedSale] = useState(null);
  const [modifierTarget, setModifierTarget] = useState(null);
  const [activeMenuCategory, setActiveMenuCategory] = useState("All");

  const orderTypeOptions = posMeta.orderTypes.map((key) => {
    const option = ORDER_TYPES[key];
    return key === "takeaway" && !posMeta.allowTables ? { ...option, label: "Counter" } : option;
  });
  const activeOrderType = posMeta.orderTypes.includes(orderType) ? orderType : posMeta.orderTypes[0];
  const paymentOptions = POS_PAYMENT_METHODS.filter(({ key }) => key !== "mixed");

  const { data: productData, isFetching: isSearchingProducts, isError: hasProductSearchError } = useQuery({
    queryKey: ["pos-products-billing", search],
    queryFn: () => posProductApi.list({ search, limit: 12, isAvailable: true }),
    enabled: search.trim().length > 0,
  });
  const searchResults = productData?.data?.products || [];

  const { data: allProductData, isLoading: isLoadingCatalog, isError: hasCatalogError } = useQuery({
    queryKey: ["pos-products-all"],
    queryFn: () => posProductApi.list({ limit: 100, isAvailable: true }),
  });
  const allProducts = allProductData?.data?.products || [];
  const menuCategories = ["All", ...new Set(allProducts.map((product) => product.menuCategory || product.category).filter(Boolean))];
  const gridProducts =
    activeMenuCategory === "All"
      ? allProducts
      : allProducts.filter((product) => (product.menuCategory || product.category) === activeMenuCategory);

  const { data: customerData, isFetching: isSearchingCustomers, isError: hasCustomerSearchError } = useQuery({
    queryKey: ["pos-customers-billing", customerSearch],
    queryFn: () =>
      posCustomerApi.list({
        search: customerSearch,
        includeWalkIn: true,
        limit: 8,
      }),
    enabled: customerSearch.trim().length > 0,
  });
  const customerResults = customerData?.data || [];

  const { data: walkInCustomerData } = useQuery({
    queryKey: ["pos-default-walk-in"],
    queryFn: () =>
      posCustomerApi.list({
        includeWalkIn: true,
        customerType: "walk_in",
        limit: 1,
      }),
    staleTime: 5 * 60 * 1000,
  });
  const walkInCustomer = walkInCustomerData?.data?.[0] || null;
  const activeCustomer = selectedCustomer ?? walkInCustomer ?? null;

  const { data: currentShiftData, isLoading: isLoadingShift, isError: hasShiftError } = useQuery({
    queryKey: ["pos-current-shift"],
    queryFn: () => posShiftApi.current(),
    refetchInterval: 60 * 1000,
  });
  const currentShift = currentShiftData?.data || null;
  const hasOpenShift = Boolean(currentShift?._id);

  const { data: tablesData } = useQuery({
    queryKey: ["pos-tables"],
    queryFn: () => posTableApi.list(),
    enabled: posMeta.allowTables,
  });
  const availableTables = (tablesData?.data || []).filter((table) => table.status === "available" || table.status === "reserved");

  useEffect(() => {
    const targetTableId = location.state?.tableId;
    if (!targetTableId || !posMeta.allowTables) return;

    const seedKey = `${location.key}:${targetTableId}`;
    if (routeTableSeedRef.current === seedKey) return;

    const matchedTable = availableTables.find((table) => table._id === targetTableId);
    if (!matchedTable) return;

    setOrderType("dine-in");
    setSelectedTable(matchedTable);
    routeTableSeedRef.current = seedKey;
  }, [availableTables, location.key, location.state, posMeta.allowTables]);

  const isWalkInSelection = Boolean(activeCustomer) && activeCustomer?.customerType === "walk_in";
  const hasSelectedCustomerAccount = Boolean(activeCustomer?._id) && !isWalkInSelection;
  const activeSearchCatalog = searchResults.length > 0 ? [...searchResults, ...allProducts] : allProducts;
  const cartQuantity = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  const resetBill = () => {
    setCart([]);
    setSearch("");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setShowQuickCustomerForm(false);
    setQuickCustomer({ name: "", phone: "" });
    setOverallDiscount(0);
    setPaymentMethod("cash");
    setPaidAmount("");
    setLoyaltyRedeem(0);
    setDeliveryAddress("");
    setNotes("");
    setSelectedTable(null);
    setSelectedCustomer(null);
    searchRef.current?.focus();
  };

  const saleMutation = useMutation({
    mutationFn: (payload) => posSaleApi.create(payload),
    onSuccess: (response) => {
      const savedSale = response?.data || response;
      const shouldAutoPrint = checkoutIntentRef.current === "print";
      toast.success("Bill saved");
      setCompletedSale(savedSale);
      resetBill();
      checkoutIntentRef.current = "pay";
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products-billing"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products-all"] });
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pos-tables"] });
      queryClient.invalidateQueries({ queryKey: ["pos-current-shift"] });
      if (shouldAutoPrint) {
        window.setTimeout(() => window.print(), 250);
      }
    },
    onError: (error) => {
      checkoutIntentRef.current = "pay";
      toast.error(error.response?.data?.message || "Sale failed");
    },
  });

  const quickCustomerMutation = useMutation({
    mutationFn: (payload) => posCustomerApi.create(payload),
    onSuccess: (response) => {
      const createdCustomer = response?.data || response?.customer || response;
      toast.success("Customer created");
      setSelectedCustomer(createdCustomer || null);
      setCustomerSearch("");
      setShowCustomerDropdown(false);
      setShowQuickCustomerForm(false);
      setQuickCustomer({ name: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["pos-customers"] });
      queryClient.invalidateQueries({ queryKey: ["pos-customers-billing"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not create customer"),
  });

  const cartKey = (productId, modifiers) => productId + "-" + JSON.stringify(modifiers || []);

  const addToCart = (product, qty = 1, modifiers = [], note = "") => {
    if (!isProductSellable(product)) {
      toast.error(`"${product.name}" is not available for billing right now.`);
      return;
    }
    setSearch("");
    const key = cartKey(product._id, modifiers);
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item._key === key);
      if (existingItem && modifiers.length === 0) {
        return currentCart.map((item) => (item._key === key ? { ...item, qty: item.qty + qty } : item));
      }
      const extraPrice = modifiers.reduce((sum, modifier) => sum + (modifier.price || 0), 0);
      return [
        ...currentCart,
        {
          _key: key,
          productId: product._id,
          name: product.name,
          sku: product.sku || "",
          barcode: product.barcode || "",
          basePrice: product.sellingPrice,
          price: product.sellingPrice + extraPrice,
          taxRate: product.taxRate,
          qty,
          discount: 0,
          stockQty: product.stockQty,
          modifiers,
          notes: note,
          hasModifiers: product.modifiers?.length > 0,
        },
      ];
    });
    setModifierTarget(null);
    searchRef.current?.focus();
  };

  const handleProductClick = (product) => {
    if (product.modifiers?.length > 0) {
      setModifierTarget(product);
      return;
    }
    addToCart(product);
  };

  const updateQty = (key, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item._key !== key) return item;
          const nextQty = item.qty + delta;
          return nextQty <= 0 ? null : { ...item, qty: nextQty };
        })
        .filter(Boolean)
    );
  };

  const setQty = (key, value) => {
    const nextQty = Math.max(1, Number(value) || 1);
    setCart((currentCart) => currentCart.map((item) => (item._key === key ? { ...item, qty: nextQty } : item)));
  };

  const setDiscount = (key, value) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item._key !== key) return item;
        const maxDiscount = (Number(item.price) || 0) * (Number(item.qty) || 0);
        return { ...item, discount: Math.min(maxDiscount, Math.max(0, Number(value) || 0)) };
      })
    );
  };

  const removeItem = (key) => setCart((currentCart) => currentCart.filter((item) => item._key !== key));

  const handleHoldBill = () => {
    if (cart.length === 0) {
      toast.error("Add items before holding a bill.");
      return;
    }
    const snapshot = createHeldBillSnapshot({
      cart,
      paymentMethod,
      paidAmount,
      selectedCustomer: activeCustomer,
      overallDiscount,
      notes,
      orderType: activeOrderType,
      selectedTable,
      deliveryAddress,
      loyaltyRedeem,
    });
    const nextHeldBills = saveHeldBill(snapshot);
    setHeldBills(nextHeldBills);
    resetBill();
    toast.success("Bill placed on hold.");
  };

  const handleResumeHeldBill = (bill) => {
    if (!bill) return;
    if (cart.length > 0 && !window.confirm("Replace the current bill with this held bill?")) {
      return;
    }
    setCart(Array.isArray(bill.cart) ? bill.cart : []);
    setPaymentMethod(bill.paymentMethod || "cash");
    setPaidAmount(bill.paidAmount || "");
    setSelectedCustomer(bill.selectedCustomer || null);
    setOverallDiscount(Number(bill.overallDiscount) || 0);
    setNotes(bill.notes || "");
    setOrderType(bill.orderType || "takeaway");
    setSelectedTable(bill.selectedTable || null);
    setDeliveryAddress(bill.deliveryAddress || "");
    setLoyaltyRedeem(Number(bill.loyaltyRedeem) || 0);
    setHeldBills(removeHeldBill(bill.id));
    setSearch("");
    setCompletedSale(null);
    searchRef.current?.focus();
    toast.success("Held bill resumed.");
  };

  const handleDiscardBill = () => {
    if (cart.length === 0) {
      resetBill();
      return;
    }
    if (!window.confirm("Clear the current bill?")) {
      return;
    }
    resetBill();
  };

  const totals = calculateCartTotals({ cart, overallDiscount, loyaltyRedeem });
  const paymentState = calculateTenderState({
    grandTotal: totals.grandTotal,
    amountTendered: paidAmount,
    paymentMethod,
  });
  const checkoutIssues = [
    ...getCheckoutIssues({
      cart,
      orderType: activeOrderType,
      selectedTable,
      paymentMethod,
      selectedCustomer: activeCustomer,
      paymentState,
    }),
    ...(!hasOpenShift && !isLoadingShift ? ["Open a cashier shift before checkout."] : []),
  ];
  const quickTenderValues = buildQuickTenderValues(totals.grandTotal);

  const handleCheckout = (intent = "pay") => {
    if (checkoutIssues.length > 0) {
      toast.error(checkoutIssues[0]);
      return;
    }
    checkoutIntentRef.current = intent;
    saleMutation.mutate(
      buildPosSalePayload({
        cart,
        paymentMethod,
        paymentState,
        selectedCustomer: activeCustomer,
        overallDiscount,
        notes,
        orderType: activeOrderType,
        selectedTable,
        deliveryAddress,
        loyaltyRedeem,
      })
    );
  };

  const handleQuickCustomerCreate = () => {
    if (!quickCustomer.name.trim() && !quickCustomer.phone.trim()) {
      toast.error("Enter a customer name or phone");
      return;
    }
    quickCustomerMutation.mutate({
      ...quickCustomer,
      customerType: posMeta.allowTables ? "guest" : "regular",
    });
  };

  const selectedCustomerLabel = hasSelectedCustomerAccount
    ? activeCustomer?.name
    : isWalkInSelection
      ? "Walk-in customer"
      : "Walk-in ready";

  if (completedSale) {
    return (
      <WorkspacePage className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Bill Saved"
          title="Receipt is ready to print."
          description="Print the receipt now or move straight into the next bill."
          badges={[
            completedSale.invoiceNo || "Receipt ready",
            PAYMENT_METHOD_LABELS[completedSale.paymentMethod] || completedSale.paymentMethod || "Cash",
          ]}
          actions={
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.print()} className="btn-secondary">
                <Printer className="h-4 w-4" />
                Print receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompletedSale(null);
                  resetBill();
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Next bill
              </button>
            </div>
          }
        />
        <PrintableInvoice sale={completedSale} />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage className="mx-auto max-w-[96rem]">
      {modifierTarget ? (
        <ModifierModal
          product={modifierTarget}
          onConfirm={({ qty, modifiers, notes: modifierNote }) => addToCart(modifierTarget, qty, modifiers, modifierNote)}
          onClose={() => setModifierTarget(null)}
        />
      ) : null}

      <PageHeader
        eyebrow="POS Billing"
        title={
          posMeta.allowTables
            ? "Take orders, build the bill, and collect payment in one screen."
            : "Search items, build the bill, and collect payment in one screen."
        }
        description="Keep the cashier flow simple: search fast, tap to add, check totals, then pay and print."
        badges={[
          branchName ? `Branch: ${branchName}` : "Main branch",
          hasOpenShift
            ? `Shift open: ${currentShift?.openedBy?.username || "Active"}`
            : isLoadingShift
              ? "Checking shift"
              : "Shift closed",
          selectedCustomerLabel,
          `${heldBills.length} held bills`,
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/pos/shifts" className="btn-secondary">
              <ChevronDown className="h-4 w-4" />
              Shifts
            </Link>
            <Link to="/pos/sales" className="btn-secondary">
              <ShoppingCart className="h-4 w-4" />
              Bills
            </Link>
          </div>
        }
      />

      <div className="space-y-4">
        <section className="panel p-4 lg:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),auto] xl:items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Search or scan item</p>
                  <p className="text-xs text-slate-500">Search by name, SKU, or barcode. Press Enter to bill an exact barcode match instantly.</p>
                </div>
                <InfoPill tone="blue">{search.trim() ? "Search mode" : "Tap item to add"}</InfoPill>
              </div>

              <SearchField
                inputRef={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const exactMatch = findExactProductMatch(activeSearchCatalog, search);
                  if (!exactMatch) return;
                  event.preventDefault();
                  handleProductClick(exactMatch);
                }}
                placeholder="Search item name or scan barcode"
                inputClassName="h-14 rounded-2xl text-base font-medium"
              />

              {hasProductSearchError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Product search is unavailable right now. You can still use the product list below.
                </div>
              ) : null}

              {search.trim() && isSearchingProducts ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Looking for matching items...
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <InfoPill icon={ShoppingCart} tone="slate">{cartQuantity} qty in bill</InfoPill>
                <InfoPill icon={PauseCircle} tone="amber">{heldBills.length > 0 ? `${heldBills.length} held bills` : "No held bills"}</InfoPill>
                <InfoPill icon={activeOrderType === "dine-in" ? Table2 : ORDER_TYPES[activeOrderType]?.icon} tone="teal">
                  {ORDER_TYPES[activeOrderType]?.label || activeOrderType}
                </InfoPill>
                <InfoPill icon={hasOpenShift ? Check : AlertTriangle} tone={hasOpenShift ? "teal" : "rose"}>
                  {hasOpenShift ? "Shift ready" : hasShiftError ? "Shift check failed" : "Checkout locked"}
                </InfoPill>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:w-[14rem] xl:grid-cols-1">
              <button type="button" onClick={handleHoldBill} className="btn-secondary justify-center">
                <PauseCircle className="h-4 w-4" />
                Hold bill
              </button>
              <button type="button" onClick={handleDiscardBill} className="btn-secondary justify-center">
                <RotateCcw className="h-4 w-4" />
                Clear bill
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {orderTypeOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setOrderType(key);
                  if (key !== "dine-in") setSelectedTable(null);
                }}
                className={`flex min-h-12 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  activeOrderType === key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {heldBills.length > 0 ? (
          <section className="panel p-4 lg:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Resume held bill</p>
                <p className="text-xs text-slate-500">Keep rush-hour billing fast by parking a bill and reopening it in one tap.</p>
              </div>
              <InfoPill icon={PauseCircle} tone="amber">{heldBills.length} waiting</InfoPill>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
              {heldBills.map((bill) => (
                <HeldBillCard
                  key={bill.id}
                  bill={bill}
                  onResume={() => handleResumeHeldBill(bill)}
                  onRemove={() => setHeldBills(removeHeldBill(bill.id))}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(23rem,0.85fr)]">
          <section className="space-y-4">
            <div className="panel p-4 lg:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{search.trim() ? "Search results" : posMeta.allowTables ? "Menu and products" : "Products"}</p>
                  <p className="text-xs text-slate-500">
                    {search.trim()
                      ? "Search results stay focused on the current query. Clear search to return to categories."
                      : "Tap any item to add it to the bill. Category buttons keep common items easy to reach."}
                  </p>
                </div>
                <InfoPill tone="slate">{search.trim() ? `${searchResults.length} matches` : `${gridProducts.length} items`}</InfoPill>
              </div>

              {!search.trim() ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {menuCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveMenuCategory(category)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeMenuCategory === category
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4">
                {search.trim() ? (
                  hasProductSearchError ? (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">Product search could not be loaded.</div>
                  ) : isSearchingProducts ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Looking for matching products...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                      No matching product found. Try a barcode, SKU, or shorter item name.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.map((product) => <ProductListRow key={product._id} product={product} onClick={handleProductClick} />)}
                    </div>
                  )
                ) : hasCatalogError ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">Product catalog could not be loaded.</div>
                ) : isLoadingCatalog ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading product list...</div>
                ) : gridProducts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No items found in this category.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {gridProducts.map((product) => <ProductTile key={product._id} product={product} onClick={handleProductClick} />)}
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className="panel overflow-hidden p-0">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Current bill</p>
                    <p className="text-xs text-slate-500">{cartQuantity > 0 ? `${cartQuantity} qty across ${cart.length} lines` : "No items added yet"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Grand total</p>
                    <p className="text-lg font-bold text-slate-900">{formatShortCurrencyNpr(totals.grandTotal)}</p>
                  </div>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="p-4">
                  <EmptyCard icon={ShoppingCart} title="Add items to start billing" message="Search an item or tap from the product list to build the bill." />
                </div>
              ) : (
                <div className="max-h-[26rem] overflow-y-auto">
                  {cart.map((item) => (
                    <CartLine
                      key={item._key}
                      item={item}
                      onDecrease={() => updateQty(item._key, -1)}
                      onIncrease={() => updateQty(item._key, 1)}
                      onQtyChange={(value) => setQty(item._key, value)}
                      onDiscountChange={(value) => setDiscount(item._key, value)}
                      onRemove={() => removeItem(item._key)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="panel p-4 lg:p-5">
              <div className="space-y-4">
                {activeOrderType === "dine-in" ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">Table</p>
                      <InfoPill icon={Table2} tone="teal">{selectedTable ? `Table ${selectedTable.number}` : "Select table"}</InfoPill>
                    </div>

                    {selectedTable ? (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">Table {selectedTable.number}</p>
                            <p className="mt-1 text-xs text-emerald-700">{selectedTable.section} / {selectedTable.capacity} seats</p>
                            {selectedTable.reservation?.customerName ? (
                              <p className="mt-2 text-[11px] font-medium text-amber-700">Reserved for {selectedTable.reservation.customerName}</p>
                            ) : null}
                          </div>
                          <button type="button" onClick={() => setSelectedTable(null)} className="rounded-2xl p-2 text-emerald-700 transition hover:bg-white/60">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {availableTables.length === 0 ? (
                          <div className="col-span-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            No tables available right now.
                          </div>
                        ) : (
                          availableTables.map((table) => {
                            const reserved = table.status === "reserved";
                            return (
                              <button
                                key={table._id}
                                type="button"
                                onClick={() => setSelectedTable(table)}
                                className={`rounded-3xl border p-3 text-center transition ${
                                  reserved
                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                <p className="text-lg font-bold">{table.number}</p>
                                <p className="mt-1 text-[11px] font-medium">{reserved ? "Reserved" : `${table.capacity} seats`}</p>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {activeOrderType === "delivery" ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">Delivery address</label>
                    <textarea
                      rows={3}
                      value={deliveryAddress}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                      placeholder="Enter delivery address"
                      className="input-primary resize-none"
                    />
                  </div>
                ) : null}

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Customer</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(walkInCustomer || {
                            _id: null,
                            name: "Walk-in Customer",
                            customerType: "walk_in",
                            loyaltyPoints: 0,
                          });
                          setCustomerSearch("");
                          setShowCustomerDropdown(false);
                          setShowQuickCustomerForm(false);
                          setLoyaltyRedeem(0);
                        }}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      >
                        Walk-in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickCustomerForm((current) => !current);
                          setQuickCustomer(buildQuickCustomerSeed(customerSearch));
                        }}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        Quick add
                      </button>
                    </div>
                  </div>

                  {activeCustomer ? (
                    <div className={`rounded-3xl border p-4 ${isWalkInSelection ? "border-slate-200 bg-slate-50" : "border-indigo-200 bg-indigo-50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{activeCustomer.name || "Walk-in Customer"}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-[0.12em] ${isWalkInSelection ? "bg-white text-slate-600" : "bg-white/80 text-indigo-700"}`}>
                              {isWalkInSelection ? "Walk-in" : String(activeCustomer.customerType || "regular").replace(/_/g, " ")}
                            </span>
                            {activeCustomer.phone ? <span className="text-slate-600">{activeCustomer.phone}</span> : null}
                            {hasSelectedCustomerAccount ? <span className="text-indigo-700">{activeCustomer.loyaltyPoints || 0} pts</span> : null}
                          </div>
                        </div>
                        {!isWalkInSelection ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setLoyaltyRedeem(0);
                            }}
                            className="rounded-2xl p-2 text-slate-500 transition hover:bg-white/70"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      {isWalkInSelection ? (
                        <p className="mt-3 text-xs text-slate-500">Walk-in is selected by default. Search or add a named customer only when needed.</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="relative mt-3">
                    <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name or phone"
                      value={customerSearch}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setCustomerSearch(nextValue);
                        if (!showQuickCustomerForm) {
                          setQuickCustomer(buildQuickCustomerSeed(nextValue));
                        }
                        setShowCustomerDropdown(true);
                        if (!nextValue.trim()) {
                          setShowQuickCustomerForm(false);
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="input-primary pl-10"
                    />

                    {showCustomerDropdown && customerSearch.trim() ? (
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                        {hasCustomerSearchError ? (
                          <div className="px-4 py-3 text-xs text-amber-700">Customer search could not be loaded right now.</div>
                        ) : isSearchingCustomers ? (
                          <div className="px-4 py-3 text-xs text-slate-500">Searching customers...</div>
                        ) : customerResults.length > 0 ? (
                          customerResults.map((customer) => (
                            <button
                              key={customer._id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearch("");
                                setShowCustomerDropdown(false);
                                setShowQuickCustomerForm(false);
                              }}
                              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{customer.phone || "No phone"}</p>
                              </div>
                              <span className="shrink-0 text-xs font-semibold text-indigo-600">{customer.loyaltyPoints || 0} pts</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-slate-500">No matching customer found.</div>
                        )}

                        {!showQuickCustomerForm ? (
                          <div className="border-t border-slate-100 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuickCustomerForm(true);
                                setQuickCustomer(buildQuickCustomerSeed(customerSearch));
                              }}
                              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              <span>Create quick customer</span>
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {showQuickCustomerForm ? (
                    <div className="mt-3 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={quickCustomer.name}
                          onChange={(event) => setQuickCustomer((previous) => ({ ...previous, name: event.target.value }))}
                          placeholder="Customer name"
                          className="input-primary"
                        />
                        <input
                          type="text"
                          value={quickCustomer.phone}
                          onChange={(event) => setQuickCustomer((previous) => ({ ...previous, phone: event.target.value }))}
                          placeholder="Phone number"
                          className="input-primary"
                        />
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => setShowQuickCustomerForm(false)} className="btn-secondary justify-center">
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickCustomerCreate}
                          disabled={quickCustomerMutation.isPending || (!quickCustomer.name.trim() && !quickCustomer.phone.trim())}
                          className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {quickCustomerMutation.isPending ? "Saving..." : "Create customer"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {hasSelectedCustomerAccount && (activeCustomer?.loyaltyPoints || 0) > 0 ? (
                    <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Redeem loyalty points</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max={activeCustomer.loyaltyPoints || 0}
                          value={loyaltyRedeem}
                          onChange={(event) => setLoyaltyRedeem(Math.min(Number(event.target.value), activeCustomer.loyaltyPoints || 0))}
                          className="h-11 w-28 rounded-2xl border border-amber-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-xs font-medium text-amber-800">{loyaltyRedeem} pts = {formatShortCurrencyNpr(loyaltyRedeem * 0.5)} off</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Bill note</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Bill note or order note"
                    className="input-primary"
                  />
                </div>
              </div>
            </section>

            <section className="panel p-4 lg:p-5">
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Bill total</p>
                      <p className="text-xs text-slate-500">Keep the final number large and easy to confirm.</p>
                    </div>
                    {hasSelectedCustomerAccount ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Earn {totals.pointsEarned} pts</span> : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatShortCurrencyNpr(totals.subtotal)}</span>
                    </div>
                    {totals.itemDiscountTotal > 0 ? (
                      <div className="flex items-center justify-between text-sm text-rose-600">
                        <span>Item discount</span>
                        <span>- {formatShortCurrencyNpr(totals.itemDiscountTotal)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>Bill discount</span>
                      <input
                        type="number"
                        min="0"
                        value={overallDiscount}
                        onChange={(event) => setOverallDiscount(Math.max(0, Number(event.target.value) || 0))}
                        className="h-10 w-28 rounded-2xl border border-slate-200 bg-white px-3 text-right text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {totals.loyaltyDiscount > 0 ? (
                      <div className="flex items-center justify-between text-sm text-amber-700">
                        <span>Loyalty discount</span>
                        <span>- {formatShortCurrencyNpr(totals.loyaltyDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>VAT</span>
                      <span>{formatShortCurrencyNpr(totals.taxTotal)}</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-900">Grand total</span>
                      <span className="text-2xl font-bold text-emerald-700">{formatShortCurrencyNpr(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Payment method</p>
                  <p className="mt-1 text-xs text-slate-500">Choose how the customer is paying. Use Due only for unpaid balances.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {paymentOptions.map((method) => (
                      <PaymentMethodButton key={method.key} method={method} active={paymentMethod === method.key} onClick={() => setPaymentMethod(method.key)} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Amount received</label>
                  {paymentMethod === "credit" ? (
                    <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This bill will stay on the customer account as due. Pick a named customer before saving.
                    </div>
                  ) : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={paymentMethod === "credit" ? "Due bill" : totals.grandTotal.toFixed(2)}
                    value={paymentMethod === "credit" ? "" : paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                    disabled={paymentMethod === "credit"}
                    className="input-primary text-lg font-semibold"
                  />
                  {paymentMethod !== "credit" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickTenderValues.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaidAmount(String(value))}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                          Rs. {value.toFixed(0)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {paymentState.changeAmount > 0 ? <InfoPill icon={Banknote} tone="teal">Change {formatShortCurrencyNpr(paymentState.changeAmount)}</InfoPill> : null}
                    {paymentState.dueAmount > 0 ? <InfoPill icon={Wallet} tone="amber">Due {formatShortCurrencyNpr(paymentState.dueAmount)}</InfoPill> : null}
                  </div>
                </div>

                {!hasOpenShift && !isLoadingShift ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Open a cashier shift before taking payment.</div>
                ) : null}

                {hasShiftError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Shift status could not be checked. Open the shift page if payment looks blocked.</div>
                ) : null}

                {checkoutIssues.length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-1">
                        {checkoutIssues.map((issue) => <p key={issue}>{issue}</p>)}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleHoldBill}
                    disabled={cart.length === 0 || saleMutation.isPending}
                    className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PauseCircle className="h-4 w-4" />
                    Hold bill
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheckout("print")}
                    disabled={cart.length === 0 || saleMutation.isPending || checkoutIssues.length > 0}
                    className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4" />
                    Pay and print
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckout("pay")}
                  disabled={cart.length === 0 || saleMutation.isPending || checkoutIssues.length > 0}
                  className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saleMutation.isPending ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  {saleMutation.isPending
                    ? "Saving bill..."
                    : paymentMethod === "credit"
                      ? `Save due bill ${formatShortCurrencyNpr(totals.grandTotal)}`
                      : `Pay now ${formatShortCurrencyNpr(totals.grandTotal)}`}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </WorkspacePage>
  );
}
