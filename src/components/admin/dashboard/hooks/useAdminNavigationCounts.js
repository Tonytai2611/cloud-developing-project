import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { bookingApi } from '../../../booking/services/bookingApi';
import { useAuth } from '../../../../hooks/useAuth';
import { env } from '../../../../config/env';

const CountsContext = createContext({ 'Bookings & Orders': null, Chat: null });

export function AdminNavigationCountsProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const adminEmail = user?.email || user?.username;
  const [counts, setCounts] = useState({ 'Bookings & Orders': null, Chat: null });
  const refreshRef = useRef(() => {});

  useEffect(() => {
    setCounts({ 'Bookings & Orders': null, Chat: null });
    if (!adminEmail) return undefined;
    const storageKey = `brewcraft-admin-seen:${adminEmail}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
    const seenOrders = new Set(Array.isArray(saved.orders) ? saved.orders : []);
    const chatRead = saved.chatRead || {};
    let active = true;
    let pending = false;
    let bookings = null;
    let socket;
    let reconnectTimer;
    let lastConversations = [];
    const persist = () => {
      try { localStorage.setItem(storageKey, JSON.stringify({ orders: [...seenOrders], chatRead })); } catch {}
    };
    const updateOrders = () => {
      if (!bookings) return;
      if (pathRef.current === '/admin/manage-ordering-food' && document.visibilityState === 'visible') {
        bookings.forEach((item) => seenOrders.add(item.id));
        persist();
      }
      setCounts((current) => ({ ...current, 'Bookings & Orders': bookings.filter((item) => !seenOrders.has(item.id)).length }));
    };
    const refreshOrders = async () => {
      if (pending) return;
      pending = true;
      try {
        const result = await bookingApi.list();
        if (active && Array.isArray(result.data)) {
          bookings = result.data;
          updateOrders();
        }
      } catch {
        // Retain the last successful count while the network recovers.
      } finally { pending = false; }
    };
    const refreshChat = () => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ action: 'getConversations', adminEmail, lastRead: chatRead }));
    };
    const readChat = (event) => {
      const { email, timestamp } = event.detail || {};
      if (!email || !timestamp || document.visibilityState !== 'visible') return;
      if (!chatRead[email] || timestamp > chatRead[email]) chatRead[email] = timestamp;
      persist();
      lastConversations = lastConversations.map((item) => item.userId === email ? { ...item, unread: 0 } : item);
      setCounts((current) => ({ ...current, Chat: lastConversations.reduce((sum, item) => sum + Number(item.unread || 0), 0) }));
      refreshChat();
    };
    const connect = () => {
      if (!env.websocketUrl) return;
      socket = new WebSocket(`${env.websocketUrl}?userId=${encodeURIComponent(adminEmail)}&role=admin&accessToken=${encodeURIComponent(localStorage.getItem('accessToken') || '')}`);
      socket.onopen = refreshChat;
      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'conversationList' && Array.isArray(data.conversations)) {
            lastConversations = data.conversations.map((item) => (
              chatRead[item.userId] && item.lastTimestamp && item.lastTimestamp <= chatRead[item.userId]
                ? { ...item, unread: 0 }
                : item
            ));
            setCounts((current) => ({ ...current, Chat: lastConversations.reduce((sum, item) => sum + Number(item.unread || 0), 0) }));
          } else if (data.type === 'newMessage') refreshChat();
        } catch {}
      };
      socket.onclose = () => {
        if (active) reconnectTimer = window.setTimeout(connect, 5000);
      };
    };
    const refresh = () => {
      updateOrders();
      refreshOrders();
      refreshChat();
    };
    refreshRef.current = updateOrders;
    refreshOrders();
    connect();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('brewcraft:chat-read', readChat);
    return () => {
      active = false;
      refreshRef.current = () => {};
      window.clearInterval(timer);
      window.clearTimeout(reconnectTimer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('brewcraft:chat-read', readChat);
      socket?.close();
    };
  }, [adminEmail]);

  useEffect(() => { refreshRef.current(); }, [pathname]);
  return React.createElement(CountsContext.Provider, { value: counts }, children);
}

export function useAdminNavigationCounts() {
  return useContext(CountsContext);
}
