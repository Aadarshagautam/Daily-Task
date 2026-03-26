import React, { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChefHat, Clock, Package, ShoppingCart, Table2, TrendingUp } from 'lucide-react'
import { posProductApi, posSaleApi, posShiftApi, posTableApi } from '../../api/posApi'
import { getBusinessPosMeta } from '../../config/businessConfigs.js'
import AppContext from '../../context/app-context.js'
import { EmptyCard, KpiCard, PageHeader, SectionCard, WorkspacePage } from '../../components/ui/ErpPrimitives.jsx'
import { formatShortCurrencyNpr } from '../../utils/nepal.js'
import POSDashboardCharts from './POSDashboardCharts.jsx'

const ORDER_TYPE_LABELS = {
  'dine-in': 'Dine-in',
  takeaway: 'Counter',
  delivery: 'Delivery',
}

const TABLE_STATUS_STYLE = {
  available: 'bg-green-50 border-green-200 text-green-700',
  occupied: 'bg-red-50 border-red-200 text-red-700',
  reserved: 'bg-amber-50 border-amber-200 text-amber-700',
  cleaning: 'bg-gray-50 border-gray-200 text-gray-500',
}

const formatMoney = value => formatShortCurrencyNpr(value || 0)

export default function POSDashboard() {
  const { branchName, orgBusinessType } = useContext(AppContext)
  const posMeta = getBusinessPosMeta(orgBusinessType)

  const { data: statsData } = useQuery({
    queryKey: ['pos-stats'],
    queryFn: () => posSaleApi.stats(),
    refetchInterval: 30000,
  })

  const { data: lowStockData } = useQuery({
    queryKey: ['pos-low-stock'],
    queryFn: () => posProductApi.lowStock(),
  })

  const { data: tablesData } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: () => posTableApi.list(),
    enabled: posMeta.allowTables,
  })

  const { data: shiftData } = useQuery({
    queryKey: ['pos-shift-current'],
    queryFn: () => posShiftApi.current(),
  })

  const stats = statsData?.data || {}
  const lowStock = lowStockData?.data || []
  const tables = tablesData?.data || []
  const shift = shiftData?.data

  const occupiedCount = tables.filter(table => table.status === 'occupied').length
  const availableCount = tables.filter(table => table.status === 'available').length
  const billingReadyCount = tables.filter(table => table.status === 'reserved').length
  const avgBill = Number(
    stats.todayAverageSale || ((Number(stats.todaySales) || 0) > 0 ? Number(stats.todayRevenue || 0) / Number(stats.todaySales || 1) : 0)
  )
  const lowStockPreview = lowStock
    .slice(0, 3)
    .map(product => product.name)
    .filter(Boolean)
    .join(', ')
  const orderMix = (stats.byOrderType || []).map(item => ({
    name: ORDER_TYPE_LABELS[item._id] || item._id,
    value: Math.round(item.total || 0),
  }))

  const chartData = {
    dailyChart: (stats.dailyChart || []).map(day => ({
      date: new Date(day._id).toLocaleDateString('en-NP', { weekday: 'short', day: 'numeric' }),
      revenue: Math.round(day.revenue),
      orders: day.count,
    })),
    pieData: orderMix,
    hourlyData: (stats.hourlyChart || []).map(item => ({
      hour: `${String(item._id).padStart(2, '0')}:00`,
      revenue: Math.round(item.revenue),
    })),
  }

  const actionRows = [
    {
      to: '/pos/billing',
      label: posMeta.quickSaleLabel || 'Start billing',
      summary: 'Open the cashier screen and start the next bill without extra searching.',
      icon: ShoppingCart,
    },
    ...(posMeta.allowTables
      ? [{
          to: '/pos/tables',
          label: 'Watch tables',
          summary: `${occupiedCount} active, ${availableCount} free, and ${billingReadyCount} waiting service right now.`,
          icon: Table2,
        }]
      : []),
    ...(posMeta.allowKitchen
      ? [{
          to: '/pos/kds',
          label: 'Watch kitchen',
          summary: 'Keep pending KOTs, ready dishes, and handover moving during service.',
          icon: ChefHat,
        }]
      : []),
    {
      to: '/pos/shifts',
      label: shift ? 'Close or review shift' : 'Open shift',
      summary: shift ? 'Match cash, eSewa, Khalti, bank, and handover before sign-off.' : 'Open the shift before billing so totals stay under one session.',
      icon: Clock,
    },
  ]

  const attentionItems = [
    !shift
      ? {
          title: 'Shift is not opened',
          detail: 'Open the shift first so billing, cash, and handover stay controlled.',
          to: '/pos/shifts',
          tone: 'rose',
        }
      : {
          title: 'Shift is open',
          detail: 'Billing is live. Check cash, wallets, and handover before day close.',
          to: '/pos/shifts',
          tone: 'emerald',
        },
    lowStock.length > 0
      ? {
          title: `${lowStock.length} stock alert${lowStock.length === 1 ? '' : 's'}`,
          detail: lowStockPreview || 'Review these items before the next rush or supplier call.',
          to: '/pos/products',
          tone: 'amber',
        }
      : {
          title: 'Stock looks healthy',
          detail: 'No immediate product shortage is showing right now.',
          to: '/pos/products',
          tone: 'teal',
        },
    posMeta.allowTables
      ? {
          title: `${occupiedCount} table${occupiedCount === 1 ? '' : 's'} in service`,
          detail:
            occupiedCount > 0
              ? `${availableCount} available and ${billingReadyCount} reserved right now.`
              : `${availableCount} tables are available for the next guests.`,
          to: '/pos/tables',
          tone: occupiedCount > 0 ? 'blue' : 'teal',
        }
      : {
          title: `${stats.todaySales || 0} bill${stats.todaySales === 1 ? '' : 's'} closed today`,
          detail:
            stats.todaySales > 0
              ? `Average bill is ${formatMoney(avgBill)} and shift totals are ready to review.`
              : 'No completed bill has been recorded yet today.',
          to: '/pos/sales',
          tone: stats.todaySales > 0 ? 'blue' : 'slate',
        },
  ].filter(Boolean)

  const modeChips = posMeta.orderTypes.map(type => ORDER_TYPE_LABELS[type])

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={posMeta.controlLabel || 'POS Control'}
        title={posMeta.dashboardTitle}
        description={posMeta.dashboardSummary}
        badges={[
          new Date().toLocaleDateString('en-NP', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          branchName ? `Branch: ${branchName}` : 'Main workspace',
          shift ? 'Shift open' : 'Shift not opened',
        ]}
        actions={
          shift ? (
            <div className="erp-chip border-emerald-200 bg-emerald-50 text-emerald-700">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Shift is open
            </div>
          ) : (
            <Link to="/pos/shifts" className="btn-primary">
              <Clock className="h-4 w-4" />
              Open shift
            </Link>
          )
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} title="Today sales" value={formatMoney(stats.todayRevenue)} detail={`${stats.todaySales || 0} bills closed today`} tone="blue" to="/pos/sales" ctaLabel="Review sales" />
        <KpiCard icon={ShoppingCart} title="Average bill" value={formatMoney(avgBill)} detail={stats.todaySales > 0 ? 'Use this to watch discounts, wallet mix, and order size.' : 'Average bill will appear once billing starts.'} tone="teal" to="/pos/sales" ctaLabel="See sales trend" />
        {posMeta.allowTables ? (
          <KpiCard icon={Table2} title="Tables in use" value={`${occupiedCount}/${tables.length || 0}`} detail={`${availableCount} available and ${billingReadyCount} reserved`} tone="amber" to="/pos/tables" ctaLabel="Open floor plan" />
        ) : (
          <KpiCard icon={Clock} title="Shift" value={shift ? 'Open' : 'Closed'} detail={shift ? 'Match cash and digital totals before close' : 'Open before billing'} tone="amber" to="/pos/shifts" ctaLabel="Manage shift" />
        )}
        <KpiCard icon={AlertTriangle} title="Stock alerts" value={lowStock.length} detail={lowStock.length > 0 ? 'Items that may block the next sale or service' : 'No urgent product shortage right now'} tone="rose" to="/pos/products" ctaLabel="Manage products" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.02fr,0.98fr]">
        <SectionCard
          eyebrow="Counter actions"
          title="Open billing, shift control, and service tools from one board."
          description="These are the actions the cashier, counter lead, or owner should reach first in live service."
        >
          <div className="grid gap-3">
            {actionRows.map(({ to, icon: Icon, label, summary }) => (
              <Link
                key={to}
                to={to}
                className="erp-list-row group rounded-[24px] px-4 py-4 hover:border-emerald-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{summary}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">Open</span>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Work to check now"
          title="Keep the next issue visible before it slows the counter."
          description="This panel should answer what needs action before the next bill, table, or rush period."
        >
          <div className="grid gap-3">
            {attentionItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="erp-list-row group px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.tone === 'rose'
                      ? 'bg-rose-50 text-rose-700'
                      : item.tone === 'amber'
                        ? 'bg-amber-50 text-amber-700'
                        : item.tone === 'blue'
                          ? 'bg-sky-50 text-sky-700'
                          : item.tone === 'emerald'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.tone === 'rose' ? 'Action' : item.tone === 'amber' ? 'Watch' : 'Ready'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Sales and rush pattern"
        title={posMeta.trendTitle || 'Watch revenue, orders, and rush patterns together.'}
        description={posMeta.trendDescription || 'Use this to understand quiet hours, rush periods, and whether order mix is changing through the day.'}
      >
        <POSDashboardCharts dailyChart={chartData.dailyChart} pieData={chartData.pieData} hourlyData={chartData.hourlyData} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {posMeta.allowTables ? (
            <SectionCard
              title={posMeta.secondaryPanelTitle || 'Floor status'}
              description={posMeta.secondaryPanelDescription || 'Keep open tables, reserved covers, and seat availability visible to the front desk.'}
              action={<Link to="/pos/tables" className="text-sm font-semibold text-slate-900">{posMeta.secondaryPanelActionLabel || 'Floor plan'}</Link>}
            >
              {tables.length === 0 ? (
                <EmptyCard
                  icon={Table2}
                  title={posMeta.secondaryPanelEmptyTitle || 'No tables configured'}
                  message={posMeta.secondaryPanelEmptyMessage || 'Set up the floor plan first so dine-in service stays clear for hosts and cashiers.'}
                  action={<Link to="/pos/tables" className="btn-secondary">{posMeta.secondaryPanelEmptyActionLabel || 'Set up tables'}</Link>}
                />
              ) : (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                  {tables.slice(0, 14).map(table => (
                    <div key={table._id} className={`cursor-default rounded-xl border p-2 text-center ${TABLE_STATUS_STYLE[table.status]}`}>
                      <div className="text-base font-bold leading-none">{table.number}</div>
                      <div className="mt-0.5 text-[9px] capitalize opacity-80">{table.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title={posMeta.secondaryPanelTitle || 'Selling modes'}
              description={posMeta.secondaryPanelDescription || 'Keep the main order paths obvious so new cashiers can work with less training.'}
              action={<Link to="/pos/billing" className="text-sm font-semibold text-slate-900">{posMeta.secondaryPanelActionLabel || 'Start billing'}</Link>}
            >
              <div className="flex flex-wrap gap-2">
                {modeChips.map(label => (
                  <span key={label} className="erp-chip">
                    {label}
                  </span>
                ))}
              </div>
              <div className="erp-subtle mt-6">
                <p className="text-sm font-semibold text-slate-900">{posMeta.secondaryPanelFocusLabel || 'Today\'s billing focus'}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{posMeta.dashboardSummary}</p>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title={posMeta.stockTitle || 'Stock alerts'}
            description={posMeta.stockDescription || 'Low stock should stay visible before it slows the next cashier, counter, or kitchen run.'}
            action={<Link to="/pos/products" className="text-sm font-semibold text-slate-900">Manage</Link>}
          >
            {lowStock.length === 0 ? (
              <EmptyCard
                icon={Package}
                title="All products are stocked"
                message="No urgent replenishment is needed right now."
              />
            ) : (
              <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                {lowStock.slice(0, 8).map(product => (
                  <div key={product._id} className="erp-list-row px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.category || product.menuCategory}</p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${product.stockQty === 0 ? 'text-rose-700' : 'text-amber-600'}`}>
                      {product.stockQty} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
      </div>
    </WorkspacePage>
  )
}
