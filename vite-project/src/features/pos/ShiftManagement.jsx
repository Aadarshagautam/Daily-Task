import React, { useContext, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Landmark,
  Receipt,
  Smartphone,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import StatePanel from "../../components/StatePanel.jsx";
import {
  EmptyCard,
  FieldLabel,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from "../../components/ui/ErpPrimitives.jsx";
import { posShiftApi } from "../../api/posApi";
import AppContext from "../../context/app-context.js";
import { formatDateTimeNepal, formatShortCurrencyNpr } from "../../utils/nepal.js";

const fmt = (value) => formatShortCurrencyNpr(value || 0);

const METHOD_META = {
  cash: {
    label: "Cash",
    icon: Banknote,
    tileClass: "border-amber-200 bg-amber-50 text-amber-900",
    iconClass: "bg-amber-100 text-amber-700",
  },
  esewa: {
    label: "eSewa",
    icon: Smartphone,
    tileClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  khalti: {
    label: "Khalti",
    icon: Smartphone,
    tileClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
    iconClass: "bg-fuchsia-100 text-fuchsia-700",
  },
  bank_transfer: {
    label: "Bank",
    icon: Landmark,
    tileClass: "border-sky-200 bg-sky-50 text-sky-900",
    iconClass: "bg-sky-100 text-sky-700",
  },
  card: {
    label: "Card",
    icon: CreditCard,
    tileClass: "border-indigo-200 bg-indigo-50 text-indigo-900",
    iconClass: "bg-indigo-100 text-indigo-700",
  },
  credit: {
    label: "Due",
    icon: Receipt,
    tileClass: "border-rose-200 bg-rose-50 text-rose-900",
    iconClass: "bg-rose-100 text-rose-700",
  },
};

const METHOD_ORDER = ["cash", "esewa", "khalti", "bank_transfer", "card", "credit"];

const duration = (from, to) => {
  const diff = Math.floor((new Date(to || Date.now()) - new Date(from)) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getShiftMethodTotals = (shift = {}) => ({
  cash: Number(shift?.salesByMethod?.cash) || 0,
  esewa: Number(shift?.salesByMethod?.esewa) || 0,
  khalti: Number(shift?.salesByMethod?.khalti) || 0,
  bank_transfer: Number(shift?.salesByMethod?.bank_transfer) || 0,
  card: Number(shift?.salesByMethod?.card) || 0,
  credit: Number(shift?.salesByMethod?.credit) || 0,
  mixed: Number(shift?.salesByMethod?.mixed) || 0,
});

const buildDayCloseSummary = (shift = null, closingCashInput = "") => {
  const methodTotals = getShiftMethodTotals(shift);
  const openingCash = Number(shift?.openingCash) || 0;
  const expectedCash = Number(shift?.expectedCash ?? openingCash + methodTotals.cash) || 0;
  const hasManualCashCount = String(closingCashInput).trim() !== "";
  const physicalCash =
    shift?.status === "closed"
      ? Number(shift?.closingCash ?? expectedCash) || 0
      : hasManualCashCount
        ? Number(closingCashInput) || 0
        : expectedCash;
  const digitalTotal =
    methodTotals.esewa +
    methodTotals.khalti +
    methodTotals.bank_transfer +
    methodTotals.card;
  const dueTotal = methodTotals.credit;
  const collectedTotal = Number(shift?.collectedTotal ?? methodTotals.cash + digitalTotal) || 0;
  const handoverTotal = physicalCash + digitalTotal;
  const cashDifference =
    shift?.status === "closed"
      ? Number(shift?.cashDifference) || 0
      : physicalCash - expectedCash;

  return {
    methodTotals,
    openingCash,
    expectedCash,
    physicalCash,
    digitalTotal,
    dueTotal,
    collectedTotal,
    handoverTotal,
    cashDifference,
  };
};

const getDifferenceMeta = (value) => {
  if (value === 0) {
    return {
      label: "Matched",
      tone: "teal",
      textClass: "text-emerald-700",
    };
  }

  if (value > 0) {
    return {
      label: "Extra cash",
      tone: "amber",
      textClass: "text-amber-700",
    };
  }

  return {
    label: "Short cash",
    tone: "rose",
    textClass: "text-rose-700",
  };
};

function MethodTile({ method, amount }) {
  const meta = METHOD_META[method] || METHOD_META.cash;
  const Icon = meta.icon;

  return (
    <div className={`rounded-3xl border p-4 ${meta.tileClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{meta.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{fmt(amount)}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, helper = null, valueClassName = "text-slate-900" }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <div>
        <p className="font-medium text-slate-600">{label}</p>
        {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      </div>
      <p className={`text-right font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

export default function ShiftManagement() {
  const { branchName, hasPermission } = useContext(AppContext);
  const qc = useQueryClient();
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);
  const canOpenShift = hasPermission("pos.shifts.open");
  const canCloseShift = hasPermission("pos.shifts.close");

  const { data: currentData, isLoading: currentLoading, isError: hasCurrentError } = useQuery({
    queryKey: ["pos-shift-current"],
    queryFn: () => posShiftApi.current(),
    refetchInterval: 30000,
  });

  const { data: historyData } = useQuery({
    queryKey: ["pos-shifts"],
    queryFn: () => posShiftApi.list(),
  });

  const shift = currentData?.data || null;
  const history = historyData?.data || [];

  const openMut = useMutation({
    mutationFn: (data) => posShiftApi.open(data),
    onSuccess: () => {
      toast.success("Shift opened");
      qc.invalidateQueries({ queryKey: ["pos-shift-current"] });
      qc.invalidateQueries({ queryKey: ["pos-shifts"] });
      setOpeningCash("");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to open shift"),
  });

  const closeMut = useMutation({
    mutationFn: ({ id, data }) => posShiftApi.close(id, data),
    onSuccess: () => {
      toast.success("Shift closed");
      qc.invalidateQueries({ queryKey: ["pos-shift-current"] });
      qc.invalidateQueries({ queryKey: ["pos-shifts"] });
      setShowCloseForm(false);
      setClosingCash("");
      setCloseNotes("");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to close shift"),
  });

  const handleOpen = (event) => {
    event.preventDefault();
    if (!canOpenShift) {
      toast.error("Your role cannot open shifts.");
      return;
    }

    openMut.mutate({ openingCash: Number(openingCash) || 0 });
  };

  const handleClose = (event) => {
    event.preventDefault();
    if (!shift) return;
    if (!canCloseShift) {
      toast.error("Your role cannot close shifts.");
      return;
    }

    const payload = {
      notes: closeNotes.trim(),
    };

    if (String(closingCash).trim() !== "") {
      payload.closingCash = Number(closingCash) || 0;
    }

    closeMut.mutate({
      id: shift._id,
      data: payload,
    });
  };

  const liveSummary = useMemo(
    () => buildDayCloseSummary(shift, closingCash),
    [shift, closingCash]
  );

  const differenceMeta = getDifferenceMeta(liveSummary.cashDifference);
  const closedHistory = history.filter((item) => item.status === "closed").slice(0, 10);

  if (currentLoading) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="teal"
          title="Loading shift workspace"
          message="Checking whether the cashier already has an active shift and collecting the latest close data."
        />
      </WorkspacePage>
    );
  }

  if (hasCurrentError) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="rose"
          title="Unable to load shift data"
          message="The POS shift workspace could not load right now. Refresh and try again."
        />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Day Close"
        title="Shift and day-close workspace"
        description="Open a shift, watch live payment totals, then close the day with cash, wallet, bank, due, and handover numbers in one screen."
        badges={[
          shift ? "Shift open" : "No active shift",
          branchName ? `Branch: ${branchName}` : "Main workspace",
          new Date().toLocaleDateString("en-NP", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
        ]}
      />

      {shift ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <KpiCard
              icon={Clock}
              title="Shift time"
              value={duration(shift.openedAt, null)}
              detail={`Opened ${new Date(shift.openedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}`}
              tone="blue"
            />
            <KpiCard
              icon={Wallet}
              title="Opening cash"
              value={fmt(liveSummary.openingCash)}
              detail="Cash counted at shift start"
              tone="amber"
            />
            <KpiCard
              icon={DollarSign}
              title="Today sales"
              value={fmt(shift.totalSales)}
              detail={`${shift.totalTransactions || 0} bills in this shift`}
              tone="teal"
            />
            <KpiCard
              icon={Banknote}
              title="Cash to hand over"
              value={fmt(liveSummary.physicalCash)}
              detail={`Expected ${fmt(liveSummary.expectedCash)}`}
              tone="slate"
            />
            <KpiCard
              icon={Smartphone}
              title="Digital collected"
              value={fmt(liveSummary.digitalTotal)}
              detail="eSewa, Khalti, bank, and card"
              tone="blue"
            />
            <KpiCard
              icon={Receipt}
              title="Customer due"
              value={fmt(liveSummary.dueTotal)}
              detail="Unpaid balance to follow up"
              tone="rose"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <SectionCard
              eyebrow="Payment summary"
              title="Cash, wallets, bank, and due are ready for review."
              description="Use this board to verify what the cashier collected before handover."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {METHOD_ORDER.map((method) => (
                  <MethodTile
                    key={method}
                    method={method}
                    amount={liveSummary.methodTotals[method]}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Collected total</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{fmt(liveSummary.collectedTotal)}</p>
                  <p className="mt-2 text-sm text-slate-500">Cash plus digital collections in this shift.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Expected cash</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{fmt(liveSummary.expectedCash)}</p>
                  <p className="mt-2 text-sm text-slate-500">Opening cash plus cash sales so far.</p>
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Handover total</p>
                  <p className="mt-3 text-2xl font-semibold">{fmt(liveSummary.handoverTotal)}</p>
                  <p className="mt-2 text-sm text-emerald-800">Cash to hand over plus digital collections to verify.</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Close shift"
              title="Count cash and finish the day."
              description="The cashier should only need cash count, a short note, and one final difference check."
            >
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <SummaryRow
                  label="Current status"
                  value={<StatusBadge tone="teal">Active</StatusBadge>}
                  helper="Billing is running under this open shift."
                />
                <div className="border-t border-slate-200" />
                <SummaryRow
                  label="Expected cash"
                  value={fmt(liveSummary.expectedCash)}
                  helper="What should be in the drawer before counting."
                />
                <div className="border-t border-slate-200" />
                <SummaryRow
                  label="Digital collections"
                  value={fmt(liveSummary.digitalTotal)}
                  helper="eSewa, Khalti, bank, and card."
                />
                <div className="border-t border-slate-200" />
                <SummaryRow
                  label="Handover total"
                  value={fmt(liveSummary.handoverTotal)}
                  helper="Cash handover plus digital totals to verify."
                />
              </div>

              {!showCloseForm ? (
                <div className="mt-5">
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      Use the close action once cash is counted and any wallet or due issue is understood.
                    </p>
                  </div>

                  {canCloseShift ? (
                    <button
                      type="button"
                      onClick={() => setShowCloseForm(true)}
                      className="btn-primary mt-5 w-full"
                    >
                      Start day close
                    </button>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      This role can review day-close totals but cannot finish the shift.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleClose} className="mt-5 space-y-4">
                  <div>
                    <FieldLabel>Physical cash count (Rs.)</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={closingCash}
                      onChange={(event) => setClosingCash(event.target.value)}
                      placeholder="Count the cash in the drawer"
                      className="input-primary"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Leave this blank if the drawer matches the expected cash exactly.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <SummaryRow
                      label="Cash counted"
                      value={fmt(liveSummary.physicalCash)}
                    />
                    <div className="border-t border-slate-100" />
                    <SummaryRow
                      label="Cash difference"
                      value={fmt(liveSummary.cashDifference)}
                      helper={differenceMeta.label}
                      valueClassName={differenceMeta.textClass}
                    />
                    <div className="border-t border-slate-100" />
                    <SummaryRow
                      label="Projected handover total"
                      value={fmt(liveSummary.handoverTotal)}
                      helper="Cash count plus digital totals."
                    />
                  </div>

                  <div>
                    <FieldLabel optional>Close note</FieldLabel>
                    <textarea
                      rows={3}
                      value={closeNotes}
                      onChange={(event) => setCloseNotes(event.target.value)}
                      placeholder="Short note about handover, shortage, wallet mismatch, or due follow-up"
                      className="input-primary resize-none"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCloseForm(false);
                        setClosingCash("");
                        setCloseNotes("");
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={closeMut.isPending}
                      className="btn-danger"
                    >
                      {closeMut.isPending ? "Closing..." : "Confirm day close"}
                    </button>
                  </div>
                </form>
              )}
            </SectionCard>
          </div>
        </>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <SectionCard
            eyebrow="Open shift"
            title="Start the cashier shift."
            description="The cashier only needs the opening cash amount before billing begins."
          >
            <form onSubmit={handleOpen} className="space-y-4">
              <div className="max-w-xl">
                <FieldLabel>Opening cash balance (Rs.)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingCash}
                  onChange={(event) => setOpeningCash(event.target.value)}
                  placeholder="0.00"
                  className="input-primary"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Enter the cash available in the drawer before the first sale.
                </p>
              </div>

              {canOpenShift ? (
                <button
                  type="submit"
                  disabled={openMut.isPending}
                  className="btn-primary"
                >
                  {openMut.isPending ? "Opening..." : "Open shift"}
                </button>
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  This role can review shift history but cannot open a new shift.
                </p>
              )}
            </form>
          </SectionCard>

          <SectionCard
            eyebrow="What this tracks"
            title="Day-close totals start building from the first bill."
            description="Once the shift is open, this page will show cash, eSewa, Khalti, bank, card, due, and handover totals in one place."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {METHOD_ORDER.map((method) => (
                <MethodTile key={method} method={method} amount={0} />
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard
        eyebrow="Recent history"
        title="Closed day-close records"
        description="Owners and managers can review cash difference, digital totals, due, and handover without opening a long audit screen."
      >
        {closedHistory.length === 0 ? (
          <EmptyCard
            icon={Clock}
            title="No closed shifts yet"
            message="Once cashiers start closing shifts, the recent day-close records will appear here."
          />
        ) : (
          <div className="space-y-4">
            {closedHistory.map((item) => {
              const summary = buildDayCloseSummary(item);
              const itemDifferenceMeta = getDifferenceMeta(summary.cashDifference);

              return (
                <div key={item._id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">
                          {new Date(item.openedAt).toLocaleDateString("en-NP", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <StatusBadge tone={itemDifferenceMeta.tone}>
                          {itemDifferenceMeta.label}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatDateTimeNepal(item.openedAt)} to {formatDateTimeNepal(item.closedAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Duration {duration(item.openedAt, item.closedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {METHOD_ORDER.map((method) => {
                        const amount = summary.methodTotals[method];
                        if (amount <= 0) return null;

                        return (
                          <StatusBadge key={method} tone="slate">
                            {METHOD_META[method]?.label || method}: {fmt(amount)}
                          </StatusBadge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sales</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{fmt(item.totalSales)}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.totalTransactions || 0} bills</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cash</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{fmt(summary.physicalCash)}</p>
                      <p className="mt-1 text-xs text-slate-500">Drawer at close</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Digital</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{fmt(summary.digitalTotal)}</p>
                      <p className="mt-1 text-xs text-slate-500">Wallets, bank, and card</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Due</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{fmt(summary.dueTotal)}</p>
                      <p className="mt-1 text-xs text-slate-500">Customer balance</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Handover</p>
                      <p className="mt-2 text-xl font-semibold">{fmt(summary.handoverTotal)}</p>
                      <p className="mt-1 text-xs text-emerald-800">Cash plus digital</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Expected cash</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{fmt(summary.expectedCash)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cash difference</p>
                      <p className={`mt-2 text-lg font-semibold ${itemDifferenceMeta.textClass}`}>
                        {fmt(summary.cashDifference)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Close note</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.notes?.trim() ? item.notes : "No close note added."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </WorkspacePage>
  );
}
