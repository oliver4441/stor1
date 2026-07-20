import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Users, CheckCircle, XCircle, Loader2, Megaphone, ShoppingBag, Tag, AlertCircle } from 'lucide-react';
import { getSubscriberCount, sendPushToAll } from '../utils/sendPush';

const PRESET_TEMPLATES = [
  {
    label: 'Flash Sale',
    icon: Tag,
    title: 'Flash Sale is Live!',
    body: 'Up to 50% off selected items. Limited time only — shop now!',
    tag: 'omix-flash-sale',
    url: '/',
    requireInteraction: true,
  },
  {
    label: 'New Arrivals',
    icon: ShoppingBag,
    title: 'New Arrivals Just Dropped',
    body: 'Check out the latest products now available on Omix.',
    tag: 'omix-new-arrivals',
    url: '/',
  },
  {
    label: 'Order Update',
    icon: CheckCircle,
    title: 'Order Status Update',
    body: 'Your Omix order has been updated. Tap to view details.',
    tag: 'omix-order-update',
    url: '/account',
  },
  {
    label: 'Cart Reminder',
    icon: AlertCircle,
    title: 'Your Cart is Waiting',
    body: 'You have items in your cart. Complete your order before they sell out!',
    tag: 'omix-cart-reminder',
    url: '/cart',
  },
];

export default function AdminNotifications() {
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { success, sent, failed, error } | null
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const loadSubscriberCount = useCallback(async () => {
    const count = await getSubscriberCount();
    setSubscriberCount(count);
  }, []);

  useEffect(() => { loadSubscriberCount(); }, [loadSubscriberCount]);

  const applyTemplate = (template) => {
    setSelectedTemplate(template.label);
    setTitle(template.title);
    setBody(template.body);
    setUrl(template.url || '/');
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    setResult(null);

    const res = await sendPushToAll({
      title: title.trim(),
      body: body.trim(),
      url,
      tag: `omix-${Date.now()}`,
      requireInteraction: false,
    });

    setResult(res);
    setSending(false);
    loadSubscriberCount();
  };

  const isFormValid = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary" />
          Push Notifications
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Send push notifications to all subscribed users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fusion-recessed-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {subscriberCount !== null ? subscriberCount : '—'}
              </p>
              <p className="text-xs text-zinc-400">Subscribers</p>
            </div>
          </div>
        </div>

        <div className="fusion-recessed-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {result ? result.sent : '—'}
              </p>
              <p className="text-xs text-zinc-400">Last Sent</p>
            </div>
          </div>
        </div>

        <div className="fusion-recessed-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {result ? result.failed : '—'}
              </p>
              <p className="text-xs text-zinc-400">Last Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div>
        <h2 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Quick Templates
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTemplate === t.label;
            return (
              <button
                key={t.label}
                onClick={() => applyTemplate(t)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-zinc-400'}`} />
                <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-zinc-300'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose */}
      <div className="fusion-recessed-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-zinc-300">Compose Notification</h2>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Flash Sale is Live!"
            maxLength={60}
            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <p className="text-[10px] text-zinc-400 mt-1">{title.length}/60</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1.5">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Up to 50% off selected items. Limited time only!"
            maxLength={160}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
          />
          <p className="text-[10px] text-zinc-400 mt-1">{body.length}/160</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1.5">Open URL on Tap</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/"
            className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        {/* Preview */}
        <div className="border border-zinc-700 rounded-xl p-4 bg-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Preview</p>
          <div className="flex items-start gap-3 bg-zinc-900 rounded-xl p-3 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {title || 'Notification Title'}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                {body || 'Notification message will appear here...'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">Omix Store · now</p>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-3 rounded-xl border ${
            result.success
              ? 'bg-green-900/20 border-green-800'
              : 'bg-red-900/20 border-red-800'
          }`}>
            <p className={`text-xs font-bold ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.success
                ? `Sent to ${result.sent} subscribers (${result.failed} failed)`
                : `Error: ${result.error}`}
            </p>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!isFormValid || sending || subscriberCount === 0}
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to {subscriberCount !== null ? subscriberCount : '...'} Subscribers
            </>
          )}
        </button>

        {subscriberCount === 0 && (
          <p className="text-xs text-center text-zinc-400">
            No users have subscribed to push notifications yet.
          </p>
        )}
      </div>
    </div>
  );
}
