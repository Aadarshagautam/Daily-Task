import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  ChefHat,
  Check,
  Coffee,
  CreditCard,
  FileBarChart,
  Package,
  Printer,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Table2,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import MarketingSection from "../components/marketing/MarketingSection.jsx";
import MarketingShell from "../components/MarketingShell.jsx";
import AppContext from "../context/app-context.js";
import { getSoftwareSignupPath } from "../data/softwareCatalog.js";

const businessCards = [
  {
    key: "shop",
    title: "Retail Shop",
    icon: Store,
    badge: "Best for shops and mini marts",
    summary:
      "Barcode-ready billing, inventory, purchases, due tracking, and daily reports for product-based businesses.",
    points: ["Fast billing", "Stock and low-stock alerts", "Customer due tracking"],
    accent: "from-blue-600 to-cyan-500",
    surface: "border-blue-200 bg-blue-50/70",
    cta: "See shop software",
    path: "/software/shop",
  },
  {
    key: "cafe",
    title: "Cafe",
    icon: Coffee,
    badge: "Best for counter service",
    summary:
      "Quick counter billing, menu items, regular customers, purchases, expenses, and shift closing in one simple flow.",
    points: ["Counter billing", "Regular customer profiles", "Daily closing"],
    accent: "from-emerald-600 to-teal-500",
    surface: "border-emerald-200 bg-emerald-50/70",
    cta: "See cafe software",
    path: "/software/cafe",
  },
  {
    key: "restaurant",
    title: "Restaurant",
    icon: UtensilsCrossed,
    badge: "Best for dine-in service",
    summary:
      "Table billing, kitchen orders, waiter flow, purchases, stock control, and daily restaurant reports built for busy service teams.",
    points: ["Table and dine-in flow", "Kitchen order management", "Cashier day close"],
    accent: "from-amber-500 to-orange-500",
    surface: "border-amber-200 bg-amber-50/80",
    cta: "See restaurant software",
    path: "/software/restaurant",
  },
  {
    key: "hotel",
    title: "Hotel",
    icon: BedDouble,
    badge: "Coming later",
    summary:
      "Hotel operations will be added later with a simpler Nepal-market approach for rooms, billing, and front desk flow.",
    points: ["Room billing later", "Front desk flow later", "Hotel reports later"],
    accent: "from-stone-600 to-slate-500",
    surface: "border-stone-200 bg-stone-50/90",
  },
];

const featureCards = [
  {
    title: "Billing",
    icon: ShoppingCart,
    summary:
      "Fast billing for cash, card, eSewa, Khalti, and customer due. Keep checkout simple for staff.",
  },
  {
    title: "Inventory",
    icon: Package,
    summary:
      "Track stock, see low-stock alerts, and stop items from quietly running out during the day.",
  },
  {
    title: "Purchases",
    icon: Receipt,
    summary:
      "Record supplier bills, buying history, and payment status without separate spreadsheets.",
  },
  {
    title: "Expenses",
    icon: CreditCard,
    summary:
      "Log daily expenses clearly so owners can understand cash outflow before closing the day.",
  },
  {
    title: "Reports",
    icon: FileBarChart,
    summary:
      "Daily sales, expense, cash, refund, payment, and low-stock reports in plain business language.",
  },
  {
    title: "Restaurant Flow",
    icon: ChefHat,
    summary:
      "Handle table orders, kitchen tickets, bill close, and service handover without extra clutter.",
  },
];

const trustCards = [
  {
    title: "NPR-ready",
    icon: TrendingUp,
    summary:
      "Built around Nepali Rupees so totals, receipts, and daily summaries feel local and familiar.",
  },
  {
    title: "VAT-friendly billing",
    icon: Receipt,
    summary:
      "Made for Nepal business billing with 13% VAT-friendly wording and cleaner invoice flows.",
  },
  {
    title: "Thermal bill printing",
    icon: Printer,
    summary:
      "Fast receipt and bill printing support for counters, cafes, and restaurant cashiers.",
  },
  {
    title: "Barcode support",
    icon: ShoppingCart,
    summary:
      "Ready for shop workflows where barcode speed matters at billing time.",
  },
  {
    title: "Wallet-ready payments",
    icon: Smartphone,
    summary:
      "Use local payment wording like eSewa and Khalti alongside cash, card, and transfer.",
  },
  {
    title: "Safe daily data",
    icon: ShieldCheck,
    summary:
      "Built to support daily backup, trusted reporting, and safer recovery for real business use.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    note: "For one small shop, cafe, or restaurant",
    highlight: "Start simple",
    bullets: ["Billing and sales", "Stock basics", "Daily reports", "One branch setup"],
    cta: "Start free trial",
    path: getSoftwareSignupPath("shop", "single-branch"),
  },
  {
    name: "Business",
    note: "For growing businesses that need daily control",
    highlight: "Most practical",
    featured: true,
    bullets: ["Purchases and expenses", "Due tracking", "Role-based access", "Better owner reporting"],
    cta: "Start business trial",
    path: getSoftwareSignupPath("restaurant", "growth"),
  },
  {
    name: "Multi-branch",
    note: "For businesses running more than one location",
    highlight: "Scale later",
    bullets: ["Branch-wise reports", "Branch staff access", "Central owner view", "Stronger oversight"],
    cta: "Start multi-branch setup",
    path: getSoftwareSignupPath("cafe", "multi-branch"),
  },
];

const heroPoints = [
  "Billing, stock, purchases, and expenses in one system",
  "Restaurant tables and kitchen orders for food businesses",
  "Daily reports owners can understand in a few seconds",
];

const LandingPage = () => {
  const { isLoggedin, hasCheckedAuth } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCheckedAuth && isLoggedin) {
      navigate("/dashboard", { replace: true });
    }
  }, [hasCheckedAuth, isLoggedin, navigate]);

  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#111827_48%,_#1f2937_100%)] text-white">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute right-[10%] top-28 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-100">
              Nepal business software for shops, cafes, and restaurants
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Billing, inventory, purchases, and daily reports made for Nepal businesses.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              CommerceOS helps Nepali business owners run billing, stock, purchases, expenses,
              customer dues, restaurant tables, and kitchen orders without heavy accounting clutter.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to={getSoftwareSignupPath("shop", "growth")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                See plans
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {["NPR-ready", "VAT-friendly", "Thermal print", "eSewa / Khalti wording"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {heroPoints.map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[32px] border border-white/10 bg-white/8 p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-4">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                      Daily dashboard
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Today at a glance</h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-right">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200">Today sales</p>
                    <p className="mt-1 text-lg font-semibold text-white">NPR 48,500</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Payments</p>
                    <div className="mt-3 space-y-2">
                      {[
                        ["Cash", "NPR 22,000"],
                        ["eSewa", "NPR 12,500"],
                        ["Khalti", "NPR 6,000"],
                        ["Card", "NPR 8,000"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-300">{label}</span>
                          <span className="font-semibold text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Restaurant flow</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        ["T1", "occupied", "bg-amber-500/20 text-amber-100"],
                        ["T2", "ready", "bg-emerald-500/20 text-emerald-100"],
                        ["T3", "billing", "bg-sky-500/20 text-sky-100"],
                        ["T4", "free", "bg-white/10 text-slate-200"],
                        ["T5", "occupied", "bg-amber-500/20 text-amber-100"],
                        ["T6", "free", "bg-white/10 text-slate-200"],
                      ].map(([table, status, style]) => (
                        <div key={table} className={`rounded-2xl px-3 py-3 text-center ${style}`}>
                          <p className="text-sm font-semibold">{table}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em]">{status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr,0.9fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Owner summary</p>
                        <p className="mt-2 text-base font-semibold text-white">Daily closing</p>
                      </div>
                      <BarChart3 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {[
                        ["Expenses", "NPR 7,500"],
                        ["Purchases", "NPR 11,200"],
                        ["Customer due", "NPR 4,300"],
                        ["Low stock", "6 items"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-white/5 px-3 py-3">
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Action list</p>
                        <p className="mt-2 text-base font-semibold text-white">What needs attention</p>
                      </div>
                      <Table2 className="h-5 w-5 text-amber-300" />
                    </div>
                    <div className="mt-4 space-y-2">
                      {[
                        "Low stock on milk, momo wrappers, and soft drinks",
                        "Two restaurant tables waiting for bill close",
                        "One supplier bill still unpaid",
                      ].map((item) => (
                        <div key={item} className="rounded-2xl bg-white/5 px-3 py-2.5 text-sm text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-4 -right-4 hidden rounded-3xl border border-white/10 bg-amber-400/15 px-4 py-3 text-sm font-medium text-amber-50 backdrop-blur md:block">
              Clear enough for owners. Fast enough for staff.
            </div>
          </div>
        </div>
      </section>

      <MarketingSection
        id="business-types"
        className="bg-[#f8f4ec] py-20"
        eyebrow="Business Types"
        title="Choose the software flow that matches your business."
        description="The homepage should make it obvious who this software is for. Start with the business type that matches your daily work, then keep billing and reporting simple for staff and owners."
      >
        <div className="grid gap-6 xl:grid-cols-4">
            {businessCards.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.key} className={`rounded-[30px] border p-6 shadow-sm ${card.surface}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {card.badge}
                      </span>
                      <h3 className="mt-4 text-2xl font-semibold text-slate-900">{card.title}</h3>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-sm ${card.accent}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600">{card.summary}</p>

                  <div className="mt-5 space-y-3">
                    {card.points.map((item) => (
                      <div key={item} className="flex gap-3 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {card.path ? (
                    <Link
                      to={card.path}
                      className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-3 text-sm font-medium text-stone-600">
                      Hotel module is planned for a later release.
                    </div>
                  )}
                </article>
              );
            })}
        </div>
      </MarketingSection>

      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.88fr,1.12fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="section-kicker">Main Features</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Practical business tools, not generic software words.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Nepali business owners usually want the basics to be clear: billing, stock, purchases,
                expenses, reports, and restaurant service flow. This homepage now leads with that.
              </p>

              <div className="mt-8 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-semibold text-emerald-900">What the software helps you do every day</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Bill customers faster",
                    "See low stock before it becomes a problem",
                    "Track supplier purchases clearly",
                    "Understand expenses before daily close",
                    "Check due and payment totals quickly",
                    "Handle tables and kitchen orders in restaurants",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{feature.summary}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <MarketingSection
        id="trust"
        className="bg-slate-950 py-20 text-white"
        eyebrow="Nepal-Market Trust"
        title="Built to feel practical and trustworthy for Nepal businesses."
        description="Owners do not buy software only for looks. They buy when billing feels local, reports feel trustworthy, and the system looks safe enough to use every day."
        eyebrowClassName="section-kicker text-emerald-200"
        titleClassName="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        descriptionClassName="mt-4 text-base leading-7 text-slate-300"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trustCards.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.summary}</p>
                </div>
              );
            })}
        </div>
      </MarketingSection>

      <MarketingSection
        id="product-preview"
        className="bg-[#f6f7fb] py-20"
        eyebrow="Inside The Product"
        title="Clean screens for owners, cashiers, and restaurant staff."
        description="There are no static screenshot assets in the codebase yet, so this section uses live product-style previews to show the kind of screen hierarchy the software is built around."
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Owner dashboard</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Daily business summary</h3>
                  </div>
                  <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                    NPR-ready
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {[
                    ["Sales", "NPR 48,500"],
                    ["Expenses", "NPR 7,500"],
                    ["Cash", "NPR 22,000"],
                    ["Low stock", "6 items"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr,0.9fr]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Top daily reports</p>
                    <div className="mt-4 space-y-2">
                      {[
                        "Daily sales report",
                        "Daily expense report",
                        "Payment method summary",
                        "Low-stock summary",
                        "Purchase summary",
                      ].map((item) => (
                        <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Today's payment mix</p>
                    <div className="mt-4 space-y-3">
                      {[
                        ["Cash", "46%"],
                        ["eSewa", "26%"],
                        ["Khalti", "12%"],
                        ["Card", "16%"],
                      ].map(([method, value]) => (
                        <div key={method}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{method}</span>
                            <span className="font-semibold text-slate-900">{value}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                              style={{ width: value }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Restaurant billing</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Table and kitchen flow</h3>
                    </div>
                    <ChefHat className="h-5 w-5 text-amber-500" />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">Active tables</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {["T1", "T2", "T3", "T4", "T5", "T6"].map((table, index) => (
                          <div
                            key={table}
                            className={`rounded-2xl px-3 py-3 text-center text-sm font-semibold ${
                              index < 3 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {table}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">Kitchen orders</p>
                      <div className="mt-3 space-y-2">
                        {[
                          "KOT-1023  Preparing",
                          "KOT-1024  Ready",
                          "KOT-1025  Waiting",
                        ].map((item) => (
                          <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shop billing</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Fast product checkout</h3>
                    </div>
                    <Store className="h-5 w-5 text-sky-600" />
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-500">Barcode or product search</span>
                      <span className="text-sm font-semibold text-slate-900">SKU-100245</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {[
                        ["Wai Wai Noodles", "2 x NPR 35"],
                        ["Coca Cola 500ml", "1 x NPR 80"],
                        ["Parle-G Biscuit", "3 x NPR 20"],
                      ].map(([name, detail]) => (
                        <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-sm">
                          <span className="text-slate-700">{name}</span>
                          <span className="font-semibold text-slate-900">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </MarketingSection>

      <MarketingSection
        id="pricing"
        className="bg-white py-20"
        eyebrow="Plans"
        title="Simple plans for one branch now, more branches later."
        description="The plan structure should feel practical for Nepal businesses. Start with the business size you need today, then move up when you need more staff access, reports, or branches."
      >
        <div className="grid gap-6 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[30px] border p-6 shadow-sm ${
                  plan.featured
                    ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        plan.featured
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {plan.highlight}
                    </span>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-900">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{plan.note}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.bullets.map((item) => (
                    <div key={item} className="flex gap-3 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={plan.path}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
        </div>
      </MarketingSection>

      <section id="contact" className="bg-[linear-gradient(180deg,_#f8f4ec_0%,_#ffffff_100%)] py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-[36px] border border-stone-200 bg-white p-8 shadow-sm sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
              <div>
                <p className="section-kicker">Demo Or Trial</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  See if it fits your shop, cafe, or restaurant.
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  The best homepage ending for this product is simple: show the business type, show the daily work,
                  build trust, then make the next step obvious.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Retail shop", "Cafe", "Restaurant", "NPR and VAT-ready"].map((item) => (
                    <span key={item} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">Choose your next step</p>
                <div className="mt-5 grid gap-3">
                  <Link
                    to={getSoftwareSignupPath("shop", "growth")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#business-types"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Compare business types
                  </a>
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Review plans
                  </a>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Built for daily billing, inventory, purchases, expenses, tables, kitchen orders, and owner reports.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
};

export default LandingPage;
