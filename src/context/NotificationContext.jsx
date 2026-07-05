// ── Omix In-App Notification Context ───────────────────────────
// Provides notification state (unread count, history) to all components.
// Syncs with localStorage for instant offline access and Supabase for persistence.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  storeNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  getUnreadCount,
  sendTypedNotification,
} from '../utils/notifications';
import { supabase } from '../utils/supabase';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const notifs = await getNotifications();
    if (mountedRef.current) {
      setNotifications(notifs || []);
      setUnreadCount(getUnreadCount());
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  // Listen for auth changes to refresh notifications
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription?.unsubscribe();
  }, [refresh]);

  // Poll for new notifications every 60s when window is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const addNotification = useCallback((type, overrides = {}) => {
    sendTypedNotification(type, overrides);
    // Refresh the list after a short delay to let the store complete
    setTimeout(refresh, 300);
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    if (mountedRef.current) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    if (mountedRef.current) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, []);

  const clearAll = useCallback(async () => {
    await clearNotifications();
    if (mountedRef.current) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        addNotification,
        markRead,
        markAllRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}

export default NotificationContext;
