import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, Calendar, Package, ShoppingCart, TrendingUp, Warehouse } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import { getExpired, getInventoryDashboard, getLowStock } from "../services/inventoryApi";
import type { InventoryDashboard } from "../services/inventoryApi";

function KpiCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

export default function InventoryReportsPage() {
  const [kpis, setKpis] = useState<InventoryDashboard | null>(null);
  const [lowStock, setLowStock] = useState<Record<string, unknown>[]>([]);
  const [expired, setExpired] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [dash, ls, exp] = await Promise.all([
          getInventoryDashboard(),
          getLowStock(),
          getExpired(),
        ]);
        setKpis(dash);
        setLowStock(ls);
        setExpired(exp);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</div>
    </div>
  );

  const potential = kpis ? kpis.totalRetailValue - kpis.totalStockValue : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
        <p className="text-sm text-gray-500">Stock health at a glance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Total Products" value={kpis?.totalProducts ?? 0} icon={Package} color="bg-indigo-500" />
        <KpiCard label="Active Products" value={kpis?.activeProducts ?? 0} icon={Package} color="bg-green-500" />
        <KpiCard label="Low Stock" value={kpis?.lowStockItems ?? 0} icon={AlertTriangle} color="bg-orange-500" />
        <KpiCard label="Out of Stock" value={kpis?.outOfStockItems ?? 0} icon={AlertTriangle} color="bg-red-500" />
        <KpiCard label="Near Expiry" value={kpis?.nearExpiryItems ?? 0} icon={Calendar} color="bg-yellow-500" sub="within 30 days" />
        <KpiCard label="Expired" value={kpis?.expiredItems ?? 0} icon={Calendar} color="bg-red-700" />
        <KpiCard label="Stock Cost Value" value={fmt(kpis?.totalStockValue ?? 0)} icon={Warehouse} color="bg-gray-500" />
        <KpiCard label="Retail Value" value={fmt(kpis?.totalRetailValue ?? 0)} icon={TrendingUp} color="bg-teal-500" />
        <KpiCard label="Potential Profit" value={fmt(potential)} icon={BarChart3} color="bg-purple-500" />
        <KpiCard label="Movements Today" value={kpis?.todayMovements ?? 0} icon={ShoppingCart} color="bg-blue-500" />
      </div>

      {/* Low Stock Table */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-gray-800">Low Stock Alerts ({lowStock.length})</h2>
        {lowStock.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
            All products are well stocked ✓
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Reorder Point</th>
                  <th className="px-5 py-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lowStock.map((p, i) => (
                  <tr key={String(p.id ?? i)} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{String(p.name ?? "—")}</td>
                    <td className="px-5 py-3.5 font-bold text-red-600">{String(p.stockQuantity ?? p.stock_quantity ?? "—")}</td>
                    <td className="px-5 py-3.5 text-gray-600">{String(p.reorderPoint ?? p.reorder_point ?? "—")}</td>
                    <td className="px-5 py-3.5 text-gray-500">{String((p.category as { name?: string })?.name ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expiry Table */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-gray-800">Expiring Soon ({expired.length})</h2>
        {expired.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
            No products expiring in the next 30 days ✓
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Expiry Date</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expired.map((p, i) => {
                  const expDate = String(p.expiryDate ?? p.expiry_date ?? "");
                  const daysLeft = expDate
                    ? Math.ceil((new Date(expDate).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <tr key={String(p.id ?? i)} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{String(p.name ?? "—")}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${daysLeft !== null && daysLeft < 0 ? "text-red-600" : "text-orange-600"}`}>
                          {expDate || "—"}
                          {daysLeft !== null && (
                            <span className="ml-1 text-xs">({daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`})</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{String(p.stockQuantity ?? p.stock_quantity ?? "—")}</td>
                      <td className="px-5 py-3.5 text-gray-500">{String((p.category as { name?: string })?.name ?? "—")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Products */}
      {kpis?.topProducts && kpis.topProducts.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-gray-800">Top Selling Products</h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Units Sold</th>
                  <th className="px-5 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kpis.topProducts.map((p, i) => (
                  <tr key={String(p.productId ?? i)} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 text-gray-400">#{i + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{String(p.productName ?? "—")}</td>
                    <td className="px-5 py-3.5 font-bold text-green-600">{String(p.totalQty ?? "—")}</td>
                    <td className="px-5 py-3.5 text-gray-700">{fmt(Number(p.revenue ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
