import { useState, useEffect } from 'react';
import { Save, Store, Truck, Bell, Palette, Eye, Calendar, Wrench, Megaphone, Image, Wallet, Gift, Package, Flag, Clock, CreditCard } from 'lucide-react';
import themesConfig from '../config/seasonal-themes.json';
import { supabase } from '../utils/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

const THEME_STATES_KEY = 'omix_theme_states';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [themes, setThemes] = useState(themesConfig.themes);
  const [saving, setSaving] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [updateSent, setUpdateSent] = useState(false);

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

  const [form, setForm] = useState({
    storeName: 'Omix Store',
    storeEmail: 'omixsystems@gmail.com',
    storePhone: '+254 768 213 649',
    currency: 'KES',
    deliveryCBD: '100',
    deliveryWithinCity: '200',
    deliveryOutside: '500',
    freeShippingThreshold: '5000',
    maintenanceMode: false,
    emailNotifications: true,
    heroTitle: '',
    heroSubtitle: '',
    heroImageUrl: '',
    // New feature settings
    walletEnabled: true,
    walletMinTopUp: '100',
    giftCardEnabled: true,
    giftCardExpiryDays: '365',
    giftCardMinAmount: '100',
    giftCardMaxAmount: '50000',
    abandonedCartEnabled: true,
    abandonedCartReminderHours: '4',
    reportsAutoResolveDays: '30',
    bundlesMaxItems: '10',
  });

  // Load saved states from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Load theme states
        const { data: themeData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'theme_enabled_states')
          .single();

        if (!cancelled && themeData?.value) {
          const savedStates = themeData.value;
          setThemes(prev => prev.map(t => ({
            ...t,
            enabled: savedStates[t.id] !== undefined ? savedStates[t.id] : t.enabled,
          })));
        }
      } catch (err) {
        // Table or row might not exist yet — use defaults
        console.warn('Could not load theme states:', err.message);
      }

      try {
        // Load maintenance mode
        const { data: mmData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();
        if (!cancelled && mmData) {
          setForm(prev => ({ ...prev, maintenanceMode: mmData.value === true }));
        }
      } catch (err) {
        console.warn('Could not fetch maintenance mode:', err.message);
      }

      try {
        const { data: heroData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'hero_override')
          .single();
        if (!cancelled && heroData?.value) {
          setForm(prev => ({
            ...prev,
            heroTitle: heroData.value.title || '',
            heroSubtitle: heroData.value.subtitle || '',
            heroImageUrl: heroData.value.imageUrl || '',
          }));
        }
      } catch (err) {
        console.warn('Could not load hero override:', err.message);
      }

      // Load feature settings
      const featureKeys = ['wallet_settings', 'gift_card_settings', 'abandoned_cart_settings', 'reporting_settings', 'bundle_settings'];
      for (const key of featureKeys) {
        try {
          const { data: fData } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .single();
          if (!cancelled && fData?.value) {
            setForm(prev => ({ ...prev, ...fData.value }));
          }
        } catch { /* settings not saved yet */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleTheme = (themeId) => {
    setThemes(prev => prev.map(t => 
      t.id === themeId ? { ...t, enabled: !t.enabled } : t
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save theme enabled states
      const themeStates = {};
      themes.forEach(t => { themeStates[t.id] = t.enabled; });

      // Check if theme_enabled_states row exists
      const { data: existingTheme } = await supabase
        .from('app_settings')
        .select('key')
        .eq('key', 'theme_enabled_states')
        .single();

      if (existingTheme) {
        await supabase
          .from('app_settings')
          .update({ value: themeStates, updated_at: new Date().toISOString() })
          .eq('key', 'theme_enabled_states');
      } else {
        await supabase
          .from('app_settings')
          .insert({ key: 'theme_enabled_states', value: themeStates, description: 'Enabled/disabled state per seasonal theme' });
      }

      // Also save to localStorage so current session sees changes immediately
      try { localStorage.setItem(THEME_STATES_KEY, JSON.stringify(themeStates)); } catch {}

      // 2. Save maintenance mode
      const mmValue = form.maintenanceMode;
      const { data: existingMM } = await supabase
        .from('app_settings')
        .select('key')
        .eq('key', 'maintenance_mode')
        .single();

      if (existingMM) {
        await supabase
          .from('app_settings')
          .update({ value: mmValue, updated_at: new Date().toISOString() })
          .eq('key', 'maintenance_mode');
      } else {
        await supabase
          .from('app_settings')
          .insert({ key: 'maintenance_mode', value: mmValue, description: 'When true, disables purchases' });
      }

      // 3. Send push notification if maintenance mode changed
      const { data: prevMM } = existingMM ? await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single() : { data: null };
      const wasMM = prevMM?.value === true;
      
      if (wasMM !== mmValue) {
        // Maintenance mode changed — notify users
        const pushPayload = mmValue 
          ? { title: '🔧 Site Under Maintenance', body: 'Omix Store is undergoing maintenance. Purchases are temporarily disabled. We\'ll be back shortly!', tag: 'maintenance-on', url: '/' }
          : { title: '✅ Site Back Online', body: 'Omix Store is fully operational again. You can now place orders as usual!', tag: 'maintenance-off', url: '/' };
        
        try {
          await fetch(`${API_BASE}/api/push/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': import.meta.env.VITE_OPENCODE_API_KEY },
            body: JSON.stringify(pushPayload),
          });
        } catch (pushErr) {
          console.warn('Push notification failed:', pushErr.message);
        }
      }
    
      // 4. Save hero override
      const heroValue = {
        title: form.heroTitle || null,
        subtitle: form.heroSubtitle || null,
        imageUrl: form.heroImageUrl || null,
      };
      const { data: existingHero } = await supabase
        .from('app_settings')
        .select('key')
        .eq('key', 'hero_override')
        .single();
      if (existingHero) {
        await supabase
          .from('app_settings')
          .update({ value: heroValue, updated_at: new Date().toISOString() })
          .eq('key', 'hero_override');
      } else {
        await supabase
          .from('app_settings')
          .insert({ key: 'hero_override', value: heroValue, description: 'Custom hero section content (overrides seasonal themes)' });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // 5. Save feature settings
      const featureSettings = {
        wallet_settings: { walletEnabled: form.walletEnabled, walletMinTopUp: form.walletMinTopUp },
        gift_card_settings: { giftCardEnabled: form.giftCardEnabled, giftCardExpiryDays: form.giftCardExpiryDays, giftCardMinAmount: form.giftCardMinAmount, giftCardMaxAmount: form.giftCardMaxAmount },
        abandoned_cart_settings: { abandonedCartEnabled: form.abandonedCartEnabled, abandonedCartReminderHours: form.abandonedCartReminderHours },
        reporting_settings: { reportsAutoResolveDays: form.reportsAutoResolveDays },
        bundle_settings: { bundlesMaxItems: form.bundlesMaxItems },
      };
      for (const [key, value] of Object.entries(featureSettings)) {
        const { data: existing } = await supabase.from('app_settings').select('key').eq('key', key).single();
        if (existing) {
          await supabase.from('app_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
        } else {
          await supabase.from('app_settings').insert({ key, value, description: `${key.replace(/_/g,' ')} configuration` });
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const sendUpdate = async () => {
    if (!updateMsg.trim()) return;
    setSendingUpdate(true);
    try {
      const res = await fetch(`${API_BASE}/api/push/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': import.meta.env.VITE_OPENCODE_API_KEY },
        body: JSON.stringify({ title: '📢 New Update', body: updateMsg.trim(), tag: 'store-update', url: '/' }),
      });
      if (res.ok) {
        setUpdateSent(true);
        setUpdateMsg('');
        setTimeout(() => setUpdateSent(false), 4000);
      }
    } catch (err) {
      console.warn('Failed to send update:', err.message);
      alert('Failed to send update notification.');
    } finally {
      setSendingUpdate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-zinc-400">Configure your store</p>
      </div>

      {saved && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-bold">Settings saved!</div>
      )}

      {/* Store Info */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-white">Store Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-300">Store Name</label>
            <input value={form.storeName} onChange={e => updateField('storeName', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Email</label>
              <input type="email" value={form.storeEmail} onChange={e => updateField('storeEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Phone</label>
              <input value={form.storePhone} onChange={e => updateField('storePhone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Truck className="w-5 h-5 text-zinc-600" />
          <h3 className="text-base font-bold text-white">Delivery</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">CBD Delivery (KES)</label>
              <input type="number" value={form.deliveryCBD} onChange={e => updateField('deliveryCBD', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Within City (KES)</label>
              <input type="number" value={form.deliveryWithinCity} onChange={e => updateField('deliveryWithinCity', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Outside Within City (KES)</label>
              <input type="number" value={form.deliveryOutside} onChange={e => updateField('deliveryOutside', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-300">Free Shipping Threshold (KES)</label>
            <input type="number" value={form.freeShippingThreshold} onChange={e => updateField('freeShippingThreshold', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm" />
            <p className="text-xs text-zinc-400 mt-1">Orders above this amount get free delivery</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-white">Notifications</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">Email Notifications</p>
              <p className="text-xs text-zinc-400">Receive email for new orders</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${form.emailNotifications ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              onClick={() => updateField('emailNotifications', !form.emailNotifications)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.emailNotifications ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Maintenance */}
      <div className={`rounded-2xl border p-6 ${
        form.maintenanceMode
          ? 'bg-amber-950/30 border-amber-300 dark:border-amber-800'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center gap-3 mb-5">
          <Wrench className={`w-5 h-5 ${form.maintenanceMode ? 'text-amber-600' : 'text-purple-500'}`} />
          <h3 className="text-base font-bold text-white">Site Status</h3>
          {form.maintenanceMode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider animate-pulse">
              Active
            </span>
          )}
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-white">Maintenance Mode</p>
            <p className="text-xs text-zinc-400">Temporarily disable purchases for customers</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${
            form.maintenanceMode ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
            onClick={() => updateField('maintenanceMode', !form.maintenanceMode)}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.maintenanceMode ? 'translate-x-5.5' : 'translate-x-0.5'
            }`} />
          </div>
        </label>
        {form.maintenanceMode && (
          <div className="mt-4 p-3 rounded-xl bg-amber-900/40 border border-amber-300 dark:border-amber-700">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              ⚠️ Customers can browse but cannot add to cart or checkout. They will see a maintenance warning banner.
            </p>
          </div>
        )}
      </div>

      {/* Hero Override */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Image className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-white">Hero Override</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Override the hero section title, subtitle, and image. Leave blank to use the seasonal theme defaults.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Hero Title</label>
            <input type="text" value={form.heroTitle} onChange={e => updateField('heroTitle', e.target.value)}
              placeholder="e.g. Kenya's #1 Online Store"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-emerald-500 focus:outline-none text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Hero Subtitle</label>
            <input type="text" value={form.heroSubtitle} onChange={e => updateField('heroSubtitle', e.target.value)}
              placeholder="e.g. M-Pesa Payments &middot; Free Delivery &middot; 7-Day Returns"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-emerald-500 focus:outline-none text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Hero Image URL</label>
            <input type="url" value={form.heroImageUrl} onChange={e => updateField('heroImageUrl', e.target.value)}
              placeholder="https://example.com/hero.jpg"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-emerald-500 focus:outline-none text-white text-sm" />
          </div>
        </div>
      </div>

      {/* Seasonal Themes */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-pink-500" />
          <h3 className="text-base font-bold text-white">Seasonal Themes</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
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
            <p className="text-xs text-zinc-400 mt-1">
              {activeTheme.dateRange.start} — {activeTheme.dateRange.end}
              {activeTheme.particleType && activeTheme.particleType !== 'none' && ` · ${activeTheme.particleType} particles`}
            </p>
          </div>
        )}

        {!activeTheme && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <p className="text-xs text-zinc-400">No seasonal theme is currently active. Enable one below to get started.</p>
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
                    <p className="text-sm font-semibold text-white">{theme.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
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
                    className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
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
                className="mt-2 text-xs text-zinc-400 hover:text-zinc-700"
              >
                Close preview
              </button>
            </div>
          );
        })()}
      </div>

      {/* Broadcast Update */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Megaphone className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-bold text-white">Broadcast Update</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-3">
          Send a push notification to all users who have enabled notifications. Use for new features, promotions, or important announcements.
        </p>
        <textarea
          value={updateMsg}
          onChange={e => setUpdateMsg(e.target.value)}
          placeholder="What's new at Omix Store?..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-transparent focus:border-primary focus:outline-none text-white text-sm resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-zinc-400">{updateMsg.length}/200</span>
          {updateSent && (
            <span className="text-xs font-bold text-green-600"> Update sent!</span>
          )}
          <button
            onClick={sendUpdate}
            disabled={!updateMsg.trim() || sendingUpdate}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all"
          >
            <Megaphone className={`w-3.5 h-3.5 ${sendingUpdate ? 'animate-pulse' : ''}`} />
            {sendingUpdate ? 'Sending...' : 'Send Update'}
          </button>
        </div>
      </div>

      {/* Wallet Settings */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-white">Wallet & Store Credit</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">Enable Wallet</p>
              <p className="text-xs text-zinc-400">Allow customers to use store credit/wallet</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${form.walletEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              onClick={() => updateField('walletEnabled', !form.walletEnabled)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.walletEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </div>
          </label>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-300">Minimum Top-Up (KES)</label>
            <input type="number" value={form.walletMinTopUp} onChange={e => updateField('walletMinTopUp', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-emerald-500 focus:outline-none text-white text-sm" />
          </div>
        </div>
      </div>

      {/* Gift Card Settings */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Gift className="w-5 h-5 text-pink-500" />
          <h3 className="text-base font-bold text-white">Gift Cards</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">Enable Gift Cards</p>
              <p className="text-xs text-zinc-400">Allow customers to buy and redeem gift cards</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${form.giftCardEnabled ? 'bg-pink-500' : 'bg-zinc-700'}`}
              onClick={() => updateField('giftCardEnabled', !form.giftCardEnabled)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.giftCardEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </div>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Expiry (days)</label>
              <input type="number" value={form.giftCardExpiryDays} onChange={e => updateField('giftCardExpiryDays', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-pink-500 focus:outline-none text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Min Amount (KES)</label>
              <input type="number" value={form.giftCardMinAmount} onChange={e => updateField('giftCardMinAmount', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-pink-500 focus:outline-none text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">Max Amount (KES)</label>
              <input type="number" value={form.giftCardMaxAmount} onChange={e => updateField('giftCardMaxAmount', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-pink-500 focus:outline-none text-white text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Abandoned Cart Settings */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-white">Abandoned Cart Recovery</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">Enable Recovery</p>
              <p className="text-xs text-zinc-400">Track abandoned carts and send reminders</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${form.abandonedCartEnabled ? 'bg-amber-500' : 'bg-zinc-700'}`}
              onClick={() => updateField('abandonedCartEnabled', !form.abandonedCartEnabled)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.abandonedCartEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </div>
          </label>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-300">Reminder Delay (hours)</label>
            <input type="number" value={form.abandonedCartReminderHours} onChange={e => updateField('abandonedCartReminderHours', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-amber-500 focus:outline-none text-white text-sm" />
            <p className="text-xs text-zinc-400 mt-1">Hours after abandonment before sending a reminder</p>
          </div>
        </div>
      </div>

      {/* Reporting Settings */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Flag className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-bold text-white">Reports & Moderation</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-300">Auto-Resolve Reports After (days)</label>
            <input type="number" value={form.reportsAutoResolveDays} onChange={e => updateField('reportsAutoResolveDays', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-red-500 focus:outline-none text-white text-sm" />
            <p className="text-xs text-zinc-400 mt-1">Reports older than this are auto-dismissed</p>
          </div>
        </div>
      </div>

      {/* Bundle Settings */}
      <div className="fusion-recessed-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Package className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-white">Product Bundles</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-zinc-300">Max Items Per Bundle</label>
            <input type="number" value={form.bundlesMaxItems} onChange={e => updateField('bundlesMaxItems', e.target.value)}
              className="w-full md:w-1/3 px-4 py-2.5 rounded-xl bg-zinc-800 border border-transparent focus:border-blue-500 focus:outline-none text-white text-sm" />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-hover disabled:opacity-50 shadow-lg shadow-primary/20 transition-all">
          <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
