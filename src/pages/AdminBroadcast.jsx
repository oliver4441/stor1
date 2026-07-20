import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Send, Mail, Bell, Loader2, CheckCircle, AlertTriangle, Users, Power, Fingerprint } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      token = stored?.currentSession?.access_token || stored?.access_token;
    } catch {}
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export default function AdminBroadcast() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Broadcast master settings
  const [settings, setSettings] = useState({ enabled: true, default_email: true, default_push: true });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSetting, setSavingSetting] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/admin/broadcast/settings`, { headers });
        const data = await res.json();
        if (data.success) setSettings(data.settings);
      } catch {} finally { setSettingsLoading(false); }
    })();
  }, []);

  const updateSetting = async (key, value) => {
    setSavingSetting(key);
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_BASE}/api/admin/broadcast/settings`, {
        method: 'PUT', headers,
        body: JSON.stringify(next),
      });
    } catch (e) { setError('Failed to save setting'); }
    finally { setSavingSetting(''); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required');
      return;
    }
    setSending(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/admin/broadcast`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ subject, body, sendEmail, sendPush }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Broadcast failed');
      setResult(data);
      setSubject('');
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">Broadcast to All Users</h2>
        <p className="text-sm text-zinc-400">Send an email and/or push notification to every registered Omix Store user.</p>
      </div>

      {!settingsLoading && (
        <div className="fusion-recessed-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white">Broadcast Controls</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Enable broadcasts</p>
              <p className="text-xs text-zinc-500">Turn off to block all broadcast sends.</p>
            </div>
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              disabled={savingSetting === 'enabled'}
              className={`relative w-12 h-7 rounded-full transition-colors ${settings.enabled ? 'bg-primary' : 'bg-zinc-600'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Default: email channel</p>
              <p className="text-xs text-zinc-500">Used when a broadcast doesn't specify.</p>
            </div>
            <button
              onClick={() => updateSetting('default_email', !settings.default_email)}
              disabled={savingSetting === 'default_email'}
              className={`relative w-12 h-7 rounded-full transition-colors ${settings.default_email ? 'bg-primary' : 'bg-zinc-600'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.default_email ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Default: push channel</p>
              <p className="text-xs text-zinc-500">Used when a broadcast doesn't specify.</p>
            </div>
            <button
              onClick={() => updateSetting('default_push', !settings.default_push)}
              disabled={savingSetting === 'default_push'}
              className={`relative w-12 h-7 rounded-full transition-colors ${settings.default_push ? 'bg-primary' : 'bg-zinc-600'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.default_push ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          {!settings.enabled && (
            <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-800/40 flex items-center gap-2 text-sm text-amber-400">
              <Power className="w-4 h-4" /> Broadcasts are currently DISABLED — sends will be blocked until re-enabled.
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="p-4 rounded-2xl bg-green-900/20 border border-green-800/40 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-green-400 font-bold">Broadcast sent</p>
            <p className="text-zinc-300">Emails delivered: <span className="font-bold text-white">{result.emailSent}</span> · Push sent: <span className="font-bold text-white">{result.pushSent}</span> · Total users: <span className="font-bold text-white">{result.totalUsers}</span></p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSend} className="fusion-recessed-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-1.5 text-zinc-300">Subject</label>
          <input
            type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. New arrivals this week at Omix Store"
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5 text-zinc-300">Message</label>
          <textarea
            value={body} onChange={e => setBody(e.target.value)} rows={8}
            placeholder="Write your announcement here. It will be sent to all users."
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm resize-y focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Delivery channels</p>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 cursor-pointer">
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-4 h-4 accent-primary" />
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-sm text-zinc-200">Send email to all users</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 cursor-pointer">
            <input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} className="w-4 h-4 accent-primary" />
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-zinc-200">Send push notification to subscribed devices</span>
          </label>
        </div>

        <button
          type="submit" disabled={sending}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : 'Send Broadcast'}
        </button>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Recipients are all registered accounts with a confirmed email.
        </p>
      </form>
    </div>
  );
}
