import { useState } from 'react';
import { Save, Store, Truck, Bell, Globe } from 'lucide-react';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    storeName: 'Omix Store',
    storeEmail: 'omixsystems@gmail.com',
    storePhone: '+254 768 213 649',
    currency: 'KES',
    deliveryCBD: '100',
    deliveryKericho: '200',
    deliveryOutside: '500',
    freeShippingThreshold: '5000',
    maintenanceMode: false,
    emailNotifications: true,
  });

  const handleSave = () => {
    // TODO: Persist to Supabase settings table
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Settings</h2>
        <p className="text-sm text-zinc-500">Configure your store</p>
      </div>

      {saved && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-bold">Settings saved!</div>
      )}

      {/* Store Info */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Store className="w-5 h-5 text-[#ff385c]" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Store Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Store Name</label>
            <input value={form.storeName} onChange={e => updateField('storeName', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Email</label>
              <input type="email" value={form.storeEmail} onChange={e => updateField('storeEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Phone</label>
              <input value={form.storePhone} onChange={e => updateField('storePhone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Truck className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delivery</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">CBD Delivery (KES)</label>
              <input type="number" value={form.deliveryCBD} onChange={e => updateField('deliveryCBD', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Kericho (KES)</label>
              <input type="number" value={form.deliveryKericho} onChange={e => updateField('deliveryKericho', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Outside Kericho (KES)</label>
              <input type="number" value={form.deliveryOutside} onChange={e => updateField('deliveryOutside', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-700 dark:text-zinc-300">Free Shipping Threshold (KES)</label>
            <input type="number" value={form.freeShippingThreshold} onChange={e => updateField('freeShippingThreshold', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            <p className="text-xs text-zinc-500 mt-1">Orders above this amount get free delivery</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Notifications</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Email Notifications</p>
              <p className="text-xs text-zinc-500">Receive email for new orders</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${form.emailNotifications ? 'bg-[#ff385c]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              onClick={() => updateField('emailNotifications', !form.emailNotifications)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.emailNotifications ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Globe className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Site Status</h3>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Maintenance Mode</p>
            <p className="text-xs text-zinc-500">Temporarily disable the store for customers</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${form.maintenanceMode ? 'bg-[#ff385c]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            onClick={() => updateField('maintenanceMode', !form.maintenanceMode)}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.maintenanceMode ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e03150] shadow-lg shadow-[#ff385c]/20 transition-all">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}
