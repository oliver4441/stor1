// ── Omix Notification Bell with Dropdown Panel ──────────────
// Shows unread badge on bell icon. Click opens a dropdown panel
// listing recent in-app notifications with mark-read and clear actions.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, BellRing, CheckCheck, Trash2, ExternalLink, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { sounds } from '../utils/sounds';

const TYPE_ICONS = {
  ORDER_CONFIRMED: 'checkout',
  ORDER_SHIPPED: 'orderUpdate',
  ORDER_DELIVERED: 'delivery',
  REFUND_PROCESSED: 'refund',
  PRICE_DROP: 'notification',
  BACK_IN_STOCK: 'notification',
  PROMOTION: 'coupon',
  ACHIEVEMENT: 'achievement',
};

function notifIcon(type) {
  switch (type) {
    case 'ORDER_CONFIRMED':
    case 'ORDER_SHIPPED':
    case 'ORDER_DELIVERED':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // check-circle
    case 'REFUND_PROCESSED':
      return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'; // credit-card
    case 'PRICE_DROP':
      return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'; // trend-down (via arrow)
    case 'BACK_IN_STOCK':
      return 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'; // shopping-bag
    case 'PROMOTION':
      return 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'; // tag
    case 'ACHIEVEMENT':
      return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'; // award
    default:
      return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'; // bell
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead, clearAll, loading, refresh } = useNotifications();

  const visibleNotifs = notifications.slice(0, 10);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target) &&
          panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!open) {
      sounds.click();
      refresh();
    }
    setOpen(prev => !prev);
  }, [open, refresh]);

  const handleNotifClick = useCallback((notif) => {
    if (!notif.read) markRead(notif.id);
    if (notif.url && notif.url !== window.location.pathname) {
      // Allow navigation via Link; close panel
      setOpen(false);
    }
  }, [markRead]);

  const handleMarkAllRead = useCallback(() => {
    sounds.confirm();
    markAllRead();
  }, [markAllRead]);

  const handleClearAll = useCallback(() => {
    sounds.cancel();
    clearAll();
  }, [clearAll]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-amber-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-[100]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-900/20 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  aria-label="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
              </div>
            ) : visibleNotifs.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-400">No notifications yet</p>
                <p className="text-xs text-zinc-500 mt-1">Updates about orders, deals, and more will appear here.</p>
              </div>
            ) : (
              <div>
                {visibleNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                      !notif.read ? 'bg-amber-500/5' : ''
                    }`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      !notif.read ? 'bg-amber-500/10' : 'bg-zinc-800'
                    }`}>
                      <svg
                        className={`w-4 h-4 ${!notif.read ? 'text-amber-400' : 'text-zinc-400'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={notifIcon(notif.type)} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notif.read ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap flex-shrink-0">
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{notif.body}</p>
                      {notif.url && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400/70 mt-1">
                          <ExternalLink className="w-3 h-3" />
                          View details
                        </span>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))}

                {notifications.length > 10 && (
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="block text-center py-3 text-xs font-bold text-amber-400 hover:bg-zinc-800 transition-colors"
                  >
                    View all {notifications.length} notifications
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
