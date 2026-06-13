import { useState } from 'react';
import { Save, Store, Truck, Bell, Globe, Palette, Eye, Calendar } from 'lucide-react';
import themesConfig from '../config/seasonal-themes.json';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [themes, setThemes] = useState(themesConfig.themes);

  // Find currently active theme based on date
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const currentDate = `${currentMonth}-${currentDay}`;
  
  const activeTheme = themes.find(t => {
    if (!t.enabled) return false;
    const { start, end } = t.dateRange;
    if (end < start) {
      // Year-wrap range
      return currentDate >= start || currentDate <= end;
    }
    return currentDate >= start && currentDate <= end;
  });

  const toggleTheme = (themeId) => {
    setThemes(prev => prev.map(t => 
      t.id === themeId ? { ...t, enabled: !t.enabled } : t
    ));
    setSaved(false);
  };

  const handleSaveThemes = () => {
    // TODO: Persist to Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
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

      {/* Seasonal Themes */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-pink-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Seasonal Themes</h3>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Automatically transform the app look for holidays and events. Active theme changes based on date.
        </p>

        {/* Currently active */}
        {activeTheme && (
          <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: activeTheme.colors?.primary + '40', backgroundColor: activeTheme.colors?.primary + '08' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: activeTheme.colors?.primary }} />
              <span className="text-sm font-bold" style={{ color: activeTheme.colors?.primary }}>
                {activeTheme.name} is active now
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {activeTheme.dateRange.start} — {activeTheme.dateRange.end}
              {activeTheme.particleType && activeTheme.particleType !== 'none' && ` · ${activeTheme.particleType} particles`}
            </p>
          </div>
        )}

        {!activeTheme && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500">No seasonal theme is currently active. Enable one below to get started.</p>
          </div>
        )}

        {/* Theme list */}
        <div className="space-y-2">
          {themes.map(theme => {
            const isActive = activeTheme?.id === theme.id;
            return (
              <div
                key={theme.id}
                className="flex items-center justify-between p-3 rounded-xl border transition-all"
                style={{
                  borderColor: isActive ? theme.colors?.primary + '60' : '#e4e4e7',
                  backgroundColor: isActive ? theme.colors?.primary + '08' : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Color swatch */}
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900" style={{ backgroundColor: theme.colors?.primary }} />
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900" style={{ backgroundColor: theme.colors?.secondary }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{theme.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      {theme.dateRange.start} — {theme.dateRange.end}
                      {theme.particleType && theme.particleType !== 'none' && (
                        <span className="text-zinc-400">· {theme.particleType}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Preview button */}
                  <button
                    onClick={() => setPreviewTheme(previewTheme === theme.id ? null : theme.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Preview theme"
                  >
                    <Eye className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleTheme(theme.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${theme.enabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview banner */}
        {previewTheme && (() => {
          const pt = themes.find(t => t.id === previewTheme);
          if (!pt) return null;
          return (
            <div className="mt-4 p-4 rounded-xl border-2 border-dashed" style={{ borderColor: pt.colors?.primary }}>
              <p className="text-xs font-bold mb-2" style={{ color: pt.colors?.primary }}>Preview: {pt.name}</p>
              <div className="h-16 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pt.colors?.heroFrom}, ${pt.colors?.heroTo})` }}>
                <span className="text-sm font-bold" style={{ color: pt.colors?.heroText }}>{pt.heroTitle}</span>
              </div>
              <button
                onClick={() => setPreviewTheme(null)}
                className="mt-2 text-xs text-zinc-500 hover:text-zinc-700"
              >
                Close preview
              </button>
            </div>
          );
        })()}

        <button
          onClick={handleSaveThemes}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ backgroundColor: '#ff385c' }}
        >
          <Save className="w-3.5 h-3.5" />
          Save Theme Settings
        </button>
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
