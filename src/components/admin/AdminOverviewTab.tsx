import { formatNaira } from '../../utils/restaurantLogic.ts';
import type { Order } from '../../types/restaurant.ts';

export interface DashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenueNgn: number;
    paidRevenueNgn: number;
    pendingReviews: number;
    unreadMessages: number;
    totalProducts: number;
  };
  statusBreakdown: Array<{ status: string; count: number; revenue: number }>;
  categorySales: Array<{ category: string; units_sold: number; revenue: number }>;
  recentOrders: Order[];
}

interface AdminOverviewTabProps {
  data: DashboardData | null;
  onNavigateTab: (tab: string) => void;
}

export function AdminOverviewTab({ data, onNavigateTab }: AdminOverviewTabProps) {
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-xl border border-[#E8E1D3] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, statusBreakdown, categorySales, recentOrders } = data;
  const maxCategoryRevenue = Math.max(1, ...categorySales.map((c) => Number(c.revenue) || 0));
  const maxStatusCount = Math.max(1, ...statusBreakdown.map((s) => Number(s.count) || 0));

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-5 space-y-1">
          <p className="text-xs font-medium text-[#5A665F]">Total Orders</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-[#133827]">{stats.totalOrders}</p>
          <p className="text-xs text-[#5A665F]">Active catalog: {stats.totalProducts} dishes</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E1D3] p-5 space-y-1">
          <p className="text-xs font-medium text-[#5A665F]">Pending / In-Progress</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-[#9F742B]">{stats.pendingOrders}</p>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-[#15422D] hover:underline cursor-pointer"
          >
            Manage order queue
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E1D3] p-5 space-y-1">
          <p className="text-xs font-medium text-[#5A665F]">Completed Orders</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-[#15422D]">{stats.completedOrders}</p>
          <p className="text-xs text-[#5A665F]">{stats.cancelledOrders} cancelled</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E1D3] p-5 space-y-1">
          <p className="text-xs font-medium text-[#5A665F]">Total Order Revenue</p>
          <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#133827]">
            {formatNaira(stats.totalRevenueNgn)}
          </p>
          <p className="text-xs font-mono tabular-nums text-[#15422D]">
            Settled online/paid: {formatNaira(stats.paidRevenueNgn)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[#133827]">Revenue by Menu Category</h3>
            <span className="text-xs text-[#5A665F]">₦ NGN</span>
          </div>
          <div className="space-y-3">
            {categorySales.map((cat) => {
              const pct = Math.round(((Number(cat.revenue) || 0) / maxCategoryRevenue) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#17201B]">{cat.category}</span>
                    <span className="font-mono tabular-nums text-[#4D5A52]">
                      {formatNaira(cat.revenue)} ({cat.units_sold} sold)
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F3EFE6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#15422D] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E1D3] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[#133827]">Order Status Breakdown</h3>
            <span className="text-xs text-[#5A665F]">Count</span>
          </div>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-[#5A665F] py-8 text-center">
              No orders recorded yet. Orders submitted via Online Ordering will appear here immediately.
            </p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((item) => {
                const pct = Math.round(((Number(item.count) || 0) / maxStatusCount) * 100);
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#17201B]">{item.status}</span>
                      <span className="font-mono tabular-nums text-[#4D5A52]">
                        {item.count} orders · {formatNaira(item.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#F3EFE6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B88A3B] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-[#F0ECE3] flex flex-wrap gap-4 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('reviews')}
              className="font-semibold text-[#15422D] hover:underline cursor-pointer"
            >
              Pending Reviews: <span className="font-mono tabular-nums">{stats.pendingReviews}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="font-semibold text-[#15422D] hover:underline cursor-pointer"
            >
              Unread Contact Messages: <span className="font-mono tabular-nums">{stats.unreadMessages}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-[#E8E1D3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E1D3] flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#133827]">Recent Orders</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-[#15422D] hover:underline cursor-pointer"
          >
            View All Orders
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5A665F]">
            No customer orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F4] border-b border-[#E8E1D3] text-xs text-[#5A665F]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order #</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE3]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#133827]">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#17201B]">{order.customer_name}</span>
                      <span className="block text-xs text-[#5A665F] font-mono">{order.customer_phone}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-xs text-[#4D5A52]">{order.fulfillment_type}</td>
                    <td className="py-3 px-4 text-xs font-medium text-[#15422D]">{order.status}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#133827]">
                      {formatNaira(order.total_ngn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
