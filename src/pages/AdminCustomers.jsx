import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, ShoppingBag, DollarSign, Calendar, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import { fetchAllOrders } from '../utils/api';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const orders = await fetchAllOrders();

    // Aggregate customer data from orders
    const customerMap = {};
    orders.forEach(order => {
      const key = order.email || order.phone || order.customer_name || `order-${order.id}`;
      if (!customerMap[key]) {
        customerMap[key] = {
          name: order.customer_name || 'Guest',
          email: order.email || null,
          phone: order.phone || null,
          orders: [],
          totalSpent: 0,
          lastOrder: null,
        };
      }
      customerMap[key].orders.push(order);
      customerMap[key].totalSpent += parseFloat(order.total_amount || 0);
      const orderDate = new Date(order.created_at);
      if (!customerMap[key].lastOrder || orderDate > new Date(customerMap[key].lastOrder)) {
        customerMap[key].lastOrder = order.created_at;
      }
    });

    const customerList = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    setCustomers(customerList);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Customers</h2>
        <p className="text-sm text-zinc-500">{customers.length} customers</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text" placeholder="Search by name, email, or phone..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:border-[#ff385c] focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Orders</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3">Total Spent</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase px-4 py-3 hidden sm:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#ff385c]/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#ff385c]">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Mail className="w-3 h-3" />{customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <ShoppingBag className="w-3 h-3" />{customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{customer.orders.length}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-600">{formatKES(customer.totalSpent)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-zinc-500">
                        {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No customers found</h3>
          <p className="text-sm text-zinc-500">{searchQuery ? 'Try a different search' : 'Customers will appear here after placing orders'}</p>
        </div>
      )}
    </div>
  );
}
