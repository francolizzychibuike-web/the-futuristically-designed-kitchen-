import { Fragment, useState } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '../../types/restaurant.ts';
import { ORDER_STATUSES, formatNaira } from '../../utils/restaurantLogic.ts';

interface AdminOrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: number, status: OrderStatus, paymentStatus?: PaymentStatus) => Promise<void>;
}

export function AdminOrdersTab({ orders, onUpdateStatus }: AdminOrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const filtered =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    setSavingId(orderId);
    try {
      await onUpdateStatus(orderId, status);
    } finally {
      setSavingId(null);
    }
  };

  const handlePaymentChange = async (order: Order, paymentStatus: PaymentStatus) => {
    setSavingId(order.id);
    try {
      await onUpdateStatus(order.id, order.status, paymentStatus);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-[#133827]">Customer Orders ({filtered.length})</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
              statusFilter === 'all' ? 'bg-[#15422D] text-white' : 'bg-white border border-[#DCD4C4] text-[#3D4A42]'
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                statusFilter === st ? 'bg-[#15422D] text-white' : 'bg-white border border-[#DCD4C4] text-[#3D4A42]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E1D3] p-10 text-center text-sm text-[#5A665F]">
          No orders found for this filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E1D3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F4] border-b border-[#E8E1D3] text-xs text-[#5A665F]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order #</th>
                  <th className="py-3 px-4 font-semibold">Customer & Contact</th>
                  <th className="py-3 px-4 font-semibold">Fulfillment</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Order Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE3]">
                {filtered.map((order) => (
                  <Fragment key={order.id}>
                    <tr className="hover:bg-[#FAF8F4]">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-[#133827]">
                        <div>{order.order_number}</div>
                        <div className="text-[11px] text-[#5A665F] font-normal">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#17201B]">{order.customer_name}</div>
                        <div className="text-xs font-mono text-[#5A665F]">{order.customer_phone}</div>
                      </td>
                      <td className="py-3 px-4 text-xs capitalize text-[#3D4A42]">
                        {order.fulfillment_type}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Payment status for ${order.order_number}`}
                          value={order.payment_status}
                          disabled={savingId === order.id}
                          onChange={(e) => handlePaymentChange(order, e.target.value as PaymentStatus)}
                          className="px-2 py-1 text-xs bg-[#FAF8F4] border border-[#DCD4C4] rounded-md"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Order status for ${order.order_number}`}
                          value={order.status}
                          disabled={savingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 text-xs font-medium bg-[#FAF8F4] border border-[#DCD4C4] rounded-md text-[#133827]"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#133827]">
                        {formatNaira(order.total_ngn)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                          }
                          className="text-xs font-semibold text-[#15422D] hover:underline cursor-pointer"
                        >
                          {expandedOrderId === order.id ? 'Hide' : 'Inspect'}
                        </button>
                      </td>
                    </tr>

                    {expandedOrderId === order.id && (
                      <tr key={`${order.id}-detail`} className="bg-[#FAF8F4]">
                        <td colSpan={7} className="p-5 border-t border-[#E8E1D3]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <div className="space-y-1.5">
                              <p className="font-semibold text-[#133827]">Customer & Delivery Info</p>
                              <p>Email: {order.customer_email || 'Not provided'}</p>
                              <p>Address: {order.delivery_address || 'Pickup at Restaurant'}</p>
                              <p>Payment Method: {order.payment_method}</p>
                              {order.payment_reference && (
                                <p className="font-mono">Reference: {order.payment_reference}</p>
                              )}
                              {order.special_instructions && (
                                <p className="text-[#9F742B]">
                                  Note: {order.special_instructions}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <p className="font-semibold text-[#133827]">Ordered Items</p>
                              <ul className="space-y-1">
                                {order.items?.map((item, idx) => (
                                  <li key={idx} className="flex justify-between font-mono tabular-nums">
                                    <span>
                                      {item.quantity} × {item.product_name}
                                    </span>
                                    <span>{formatNaira(item.line_total_ngn)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="pt-2 border-t border-[#DCD4C4] flex justify-between font-semibold">
                                <span>Subtotal / Fee / Total</span>
                                <span className="font-mono tabular-nums">
                                  {formatNaira(order.subtotal_ngn)} + {formatNaira(order.delivery_fee_ngn)} ={' '}
                                  {formatNaira(order.total_ngn)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
