import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { env } from '../../../../config/env';

const STORAGE_KEY = 'admin_chat_conversations';

export function useAdminChat() {
  const { user } = useAuth();
  const adminEmail = user?.email || user?.username;
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setUsers(saved);
    } catch (error) {
      console.error('Failed to load saved conversations:', error);
    }
  }, []);

  useEffect(() => {
    if (users.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!adminEmail || !env.websocketUrl) {
      setLoading(false);
      return undefined;
    }

    const socket = new WebSocket(`${env.websocketUrl}?userId=${encodeURIComponent(adminEmail)}&role=admin`);
    socketRef.current = socket;
    setLoading(true);
    let customerLookupTimer;

    socket.onopen = () => {
      setIsConnected(true);
      setLoading(false);
      socket.send(JSON.stringify({ action: 'getConversations', adminEmail }));
      socket.send(JSON.stringify({ action: 'getUsers', role: 'customer' }));
      customerLookupTimer = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ action: 'getUsers', role: 'customer' }));
      }, 5000);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'conversationList') {
        const historyUsers = (data.conversations || []).map((conversation) => ({
          id: conversation.userId,
          name: conversation.userId.split('@')[0],
          email: conversation.userId,
          avatar: conversation.userId.charAt(0).toUpperCase(),
          status: 'Offline',
          unread: conversation.unread || 0,
          lastMessage: conversation.lastMessage || 'No messages',
          lastTimestamp: conversation.lastTimestamp,
        }));
        setUsers((current) => historyUsers.map((historyUser) => ({ ...historyUser, status: current.some((item) => item.email === historyUser.email && item.status === 'Online') ? 'Online' : historyUser.status })).concat(current.filter((item) => !historyUsers.some((historyUser) => historyUser.email === item.email))));
      } else if (data.type === 'userList') {
        const onlineEmails = (data.users || []).map((item) => item.userId);
        setUsers((current) => {
          const updated = current.map((item) => ({ ...item, status: onlineEmails.includes(item.email) ? 'Online' : 'Offline' }));
          (data.users || []).forEach((item) => {
            if (!updated.some((userItem) => userItem.email === item.userId)) updated.push({ id: item.userId, name: item.userId.split('@')[0], email: item.userId, avatar: item.userId.charAt(0).toUpperCase(), status: 'Online', unread: 0, lastMessage: 'Online now' });
          });
          return updated;
        });
      } else if (data.type === 'messageHistory') {
        setMessages((data.messages || []).map((message) => ({ id: message.messageId, text: message.message, timestamp: message.timestamp, isAdmin: message.senderId === adminEmail, senderName: message.senderId === adminEmail ? 'Admin' : message.senderId.split('@')[0], avatar: message.senderId === adminEmail ? 'AD' : message.senderId.charAt(0).toUpperCase() })));
      } else if (data.type === 'newMessage') {
        const isAdminMessage = data.senderId === adminEmail;
        const otherUserEmail = isAdminMessage ? data.recipientId : data.senderId;
        setUsers((current) => {
          const existing = current.find((item) => item.email === otherUserEmail);
          const nextUser = existing ? { ...existing, lastMessage: data.message, lastTimestamp: data.timestamp, unread: isAdminMessage || selectedUserRef.current?.email === otherUserEmail ? 0 : (existing.unread || 0) + 1 } : { id: otherUserEmail, name: otherUserEmail.split('@')[0], email: otherUserEmail, avatar: otherUserEmail.charAt(0).toUpperCase(), status: 'Online', unread: isAdminMessage ? 0 : 1, lastMessage: data.message, lastTimestamp: data.timestamp };
          return [nextUser, ...current.filter((item) => item.email !== otherUserEmail)];
        });
        if (selectedUserRef.current?.email === otherUserEmail) setMessages((current) => current.some((message) => message.id === data.messageId) ? current : [...current, { id: data.messageId, text: data.message, timestamp: data.timestamp, isAdmin: isAdminMessage, senderName: isAdminMessage ? 'Admin' : data.senderId.split('@')[0], avatar: isAdminMessage ? 'AD' : data.senderId.charAt(0).toUpperCase() }]);
        if (!isAdminMessage) setNotification(`New message from ${data.senderId}`);
      }
    };

    socket.onerror = () => setLoading(false);
    socket.onclose = () => setIsConnected(false);
    return () => {
      if (customerLookupTimer) window.clearInterval(customerLookupTimer);
      socketRef.current = null;
      socket.close();
    };
  }, [adminEmail]);

  useEffect(() => {
    if (shouldAutoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, shouldAutoScroll]);

  const filteredUsers = useMemo(() => users.filter((item) => `${item.name || ''} ${item.email || ''} ${item.lastMessage || ''}`.toLowerCase().includes(searchTerm.trim().toLowerCase())), [searchTerm, users]);
  const stats = useMemo(() => ({ total: users.length, online: users.filter((item) => item.status === 'Online').length, unread: users.reduce((total, item) => total + Number(item.unread || 0), 0) }), [users]);

  const selectUser = (nextUser) => {
    selectedUserRef.current = nextUser;
    setSelectedUser(nextUser);
    setMessages([]);
    setUsers((current) => current.map((item) => item.email === nextUser.email ? { ...item, unread: 0 } : item));
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ action: 'getMessages', user1: adminEmail, user2: nextUser.email }));
  };

  const sendMessage = () => {
    const message = newMessage.trim();
    if (!message || !selectedUser || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ action: 'sendMessage', senderId: adminEmail, recipientId: selectedUser.email, message }));
    setNewMessage('');
  };

  const handleScroll = () => {
    const element = messagesContainerRef.current;
    if (element) setShouldAutoScroll(element.scrollHeight - element.scrollTop - element.clientHeight < 50);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const normalized = !timestamp.endsWith('Z') && !timestamp.includes('+') ? `${timestamp}Z` : timestamp;
    return new Date(normalized).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return { filteredUsers, formatTimestamp, handleScroll, isConnected, loading, messages, messagesContainerRef, messagesEndRef, newMessage, notification, searchTerm, selectUser, selectedUser, sendMessage, setNewMessage, setNotification, setSearchTerm, stats };
}
