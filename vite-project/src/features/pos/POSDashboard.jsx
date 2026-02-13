import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { posSaleApi, posProductApi } from "../../api/posApi";

const StatCard = ({ title, value, icon: Icon, color, to }) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </Link>
);

const POSDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["pos-stats"],
    queryFn: posSaleApi.stats,
    refetchInterval: 30000,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["pos-low-stock"],
    queryFn: posProductApi.lowStock,
  });

  const s = stats?.data || {};
  const lowStock = lowStockData?.data || [];

  const formatCurrency = (n) =>
    `Rs. ${(n || 0).toLocaleString("en-NP", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">POS Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Point of Sale overview</p>
          </div>
          <Link
            to="/pos/billing"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            New Sale
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today's Sales"
            value={s.todaySales || 0}
            icon={Receipt}
            color="bg-blue-100 text-blue-600"
            to="/pos/sales"
          />
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(s.todayRevenue)}
            icon={TrendingUp}
            color="bg-green-100 text-green-600"
            to="/pos/sales"
          />
          <StatCard
            title="Total Sales"
            value={s.totalSales || 0}
            icon={ShoppingCart}
            color="bg-violet-100 text-violet-600"
            to="/pos/sales"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(s.totalRevenue)}
            icon={TrendingUp}
            color="bg-orange-100 text-orange-600"
            to="/pos/sales"
          />
        </div>

        {/* Quick Actions + Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New Sale", to: "/pos/billing", icon: ShoppingCart, color: "bg-slate-50 text-slate-600 hover:bg-slate-100" },
                { label: "Products", to: "/pos/products", icon: Package, color: "bg-orange-50 text-orange-600 hover:bg-orange-100" },
                { label: "Customers", to: "/pos/customers", icon: Users, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
                { label: "Sales History", to: "/pos/sales", icon: Receipt, color: "bg-violet-50 text-violet-600 hover:bg-violet-100" },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${a.color}`}
                >
                  <a.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{a.label}</span>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">Low Stock Alert</h2>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {lowStock.length} items
              </span>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">All stock levels are healthy</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lowStock.slice(0, 8).map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku || "No SKU"}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">
                      {p.stockQty} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;
