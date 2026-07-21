import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, ShoppingBag, DollarSign, Calendar, Users, X, Phone, MapPin, Package, Download } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import { fetchAllOrders } from '../utils/api';
import { GooeyLoader } from '@/components/ui/loader-10';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const orders = await fetchAllOrders();

    const customerMap = {};
    orders.forEach(order => {
      const key = order.email || order.phone || order.customer_name || `order-${order.id}`;
      if (!customerMap[key]) {
        customerMap[key] = {
          name: order.customer_name || 'Guest',
          email: order.email || null,
          phone: order.phone || null,
          address: order.address || null,
          city: order.city || null,
          orders: [],
          totalSpent: 0,
          lastOrder: null,
          firstOrder: null,
        };
      }
      customerMap[key].orders.push(order);
      customerMap[key].totalSpent += parseFloat(order.total_amount || 0);
      const orderDate = new Date(order.created_at);
      if (!customerMap[key].lastOrder || orderDate > new Date(customerMap[key].lastOrder)) {
        customerMap[key].lastOrder = order.created_at;
      }
      if (!customerMap[key].firstOrder || orderDate < new Date(customerMap[key].firstOrder)) {
        customerMap[key].firstOrder = order.created_at;
      }
    });

    const customerList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
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

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'First Order', 'Last Order'];
    const rows = filteredCustomers.map(c => [
      c.name, c.email || '', c.phone || '', c.orders.length, c.totalSpent,
      c.firstOrder ? new Date(c.firstOrder).toLocaleDateString('en-KE') : '',
      c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-KE') : '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Customers</h2>
          <p className="text-sm text-zinc-400">{customers.length} customers</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text" placeholder="Search by name, email, or phone..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <GooeyLoader />
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="fusion-recessed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">Orders</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">Total Spent</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden sm:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Mail className="w-3 h-3" />{customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Phone className="w-3 h-3" />{customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-zinc-300">{customer.orders.length}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-600">{formatKES(customer.totalSpent)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-zinc-400">
                        {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 p-12 text-center">
          <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No customers found</h3>
          <p className="text-sm text-zinc-400">{searchQuery ? 'Try a different search' : 'Customers will appear here after placing orders'}</p>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{selectedCustomer.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-zinc-400">{selectedCustomer.orders.length} orders</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"><X className="w-5 h-5" /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-zinc-800/50 text-center">
                <p className="text-lg font-black text-white">{selectedCustomer.orders.length}</p>
                <p className="text-xs text-zinc-400">Orders</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-800/50 text-center">
                <p className="text-lg font-black text-emerald-600">{formatKES(selectedCustomer.totalSpent)}</p>
                <p className="text-xs text-zinc-400">Total Spent</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-800/50 text-center">
                <p className="text-lg font-black text-white">{formatKES(selectedCustomer.orders.length > 0 ? selectedCustomer.totalSpent / selectedCustomer.orders.length : 0)}</p>
                <p className="text-xs text-zinc-400">Avg Order</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-800/50">
              <h4 className="text-sm font-bold text-zinc-300 mb-3">Contact Info</h4>
              <div className="space-y-2">
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-400" />{selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-400" />{selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="w-4 h-4 text-zinc-400" />{selectedCustomer.address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="text-sm font-bold text-zinc-300 mb-3">Order History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedCustomer.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-mono font-semibold text-white">#{String(order.id).slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-zinc-400">{new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatKES(order.total_amount)}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
