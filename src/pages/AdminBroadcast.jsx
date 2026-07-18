import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Send, Mail, Bell, Loader2, CheckCircle, AlertTriangle, Users } from 'lucide-react';

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

      <form onSubmit={handleSend} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-5">
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
