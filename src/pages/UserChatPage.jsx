import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Bell, Coffee, Sparkles, CalendarDays, Menu as MenuIcon, Clock3, Paperclip } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { env } from '../config/env';

// Helper for notifications
const Notification = ({ message, onClose }) => (
    <div className="fixed top-4 right-4 bg-white border-l-4 border-teal-500 shadow-lg rounded-xl p-4 max-w-sm animate-in slide-in-from-right z-50 flex items-start gap-3">
        <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-2 rounded-full text-white">
            <Bell size={20} />
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm">New Message</h4>
            <p className="text-gray-600 text-sm mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
    </div>
);

const UserChatPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [adminEmail, setAdminEmail] = useState(null); // Dynamic admin email
    const [notification, setNotification] = useState(null);
    const [userEmail, setUserEmail] = useState(null); // Dynamic user email from cookie
    const pageBackground = {
        backgroundImage: "url('/background.png')",
        backgroundPosition: 'center top',
        backgroundSize: 'cover'
    };

    const messagesEndRef = useRef(null);
    const WS_URL = env.websocketUrl;

    // Format timestamp to local Vietnam time
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        // Add Z suffix if missing to ensure UTC parsing
        let ts = timestamp;
        if (!ts.endsWith('Z') && !ts.includes('+')) {
            ts = ts + 'Z';
        }
        const date = new Date(ts);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Show notification helper
    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    // Get user email from AuthProvider
    useEffect(() => {
        if (user?.email || user?.username) {
            const newUserEmail = user.email || user.username;

            // If user changed, clear old messages and disconnect old WebSocket
            if (userEmail && userEmail !== newUserEmail) {
                console.log('User changed from', userEmail, 'to', newUserEmail);
                setMessages([]); // Clear old messages
                if (ws) {
                    ws.close();
                    setWs(null);
                }
            }

            setUserEmail(newUserEmail);
        } else {
            console.error("Not authenticated");
            navigate('/');
        }
    }, [user, navigate]);

    // Connect to WebSocket when chat opens AND user is loaded
    useEffect(() => {
        if (!userEmail || !WS_URL) return; // Wait for config and user email

        // Close existing connection if any
        if (ws) {
            ws.close();
        }

        // Clear messages for new connection
        setMessages([]);

        const socket = new WebSocket(`${WS_URL}?userId=${encodeURIComponent(userEmail)}&role=customer`);
        let adminLookupTimer;

        socket.onopen = () => {
            console.log('WebSocket connected for user:', userEmail);
            setIsConnected(true);
            setWs(socket);

            // Ask for online admins immediately
            socket.send(JSON.stringify({
                action: 'getUsers',
                role: 'admin'
            }));

            adminLookupTimer = window.setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        action: 'getUsers',
                        role: 'admin'
                    }));
                }
            }, 5000);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'userList' && data.roleFilter === 'admin') {
                const admins = data.users;
                if (admins && admins.length > 0) {
                    setAdminEmail(admins[0].userId);
                } else {
                    setAdminEmail(null);
                }
            } else if (data.type === 'messageHistory') {
                const formattedMessages = data.messages.map(msg => ({
                    id: msg.messageId,
                    text: msg.message,
                    sender: msg.senderId === userEmail ? 'You' : 'Admin',
                    senderId: msg.senderId,
                    timestamp: msg.timestamp,
                    isUser: msg.senderId === userEmail
                }));
                setMessages(formattedMessages);
            } else if (data.type === 'newMessage') {
                const isMyMessage = data.senderId === userEmail;
                const newMsg = {
                    id: data.messageId,
                    text: data.message,
                    sender: isMyMessage ? 'You' : 'Admin',
                    senderId: data.senderId,
                    timestamp: data.timestamp,
                    isUser: isMyMessage
                };

                // Check for duplicates before adding
                setMessages(prev => {
                    const exists = prev.some(m => m.id === data.messageId);
                    if (exists) return prev;
                    return [...prev, newMsg];
                });

                // Show notification if it's from Admin
                if (!isMyMessage) {
                    showNotification(`New message from Admin`);
                }
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
            setAdminEmail(null);
        };

        return () => {
            if (adminLookupTimer) window.clearInterval(adminLookupTimer);
            socket.close();
        };
    }, [userEmail]); // Re-run when userEmail changes

    // Fetch history when admin is found
    useEffect(() => {
        if (ws && isConnected && adminEmail) {
            ws.send(JSON.stringify({
                action: 'getMessages',
                user1: userEmail,
                user2: adminEmail
            }));
        }
    }, [ws, isConnected, adminEmail]);

    const sendMessage = () => {
        if (!newMessage.trim() || !ws || !isConnected) return;

        if (!adminEmail) {
            alert("No online admin found yet. Trying to find...");
            ws.send(JSON.stringify({ action: 'getUsers', role: 'admin' }));
            return;
        }

        const messageData = {
            action: 'sendMessage',
            senderId: userEmail,
            recipientId: adminEmail,
            message: newMessage
        };

        ws.send(JSON.stringify(messageData));
        setNewMessage('');
        // Message will be added when server broadcasts back via newMessage event
    };

    // Smart scroll - only auto-scroll if user is at bottom
    const messagesContainerRef = useRef(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setShouldAutoScroll(isAtBottom);
        }
    };

    // Scroll to bottom only on initial load, not on new messages
    const isInitialLoad = useRef(true);
    useEffect(() => {
        if (isInitialLoad.current && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            isInitialLoad.current = false;
        }
    }, [messages]);

    return (
        <div className="flex min-h-screen flex-col bg-[#f8fdfa] bg-fixed pt-20" style={pageBackground}>
            {/* Notification Toast */}
            {notification && (
                <Notification message={notification} onClose={() => setNotification(null)} />
            )}

            <main className="flex-1 w-full">
                <section className="mx-auto max-w-7xl px-4 pt-8 md:px-6">
                    <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white/65 p-6 shadow-sm ring-1 ring-white/80 backdrop-blur sm:flex-row sm:items-center">
                        <div className="grid h-16 w-16 place-items-center rounded-full bg-teal-50 text-teal-700">
                            <MessageCircle className="h-8 w-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="font-serif text-4xl font-black text-slate-950 md:text-5xl">Support Chat</h1>
                            <p className="mt-2 max-w-3xl text-slate-600">Get help from our team. We're here to make your BrewCraft experience even better.</p>
                        </div>
                    </div>
                </section>
                <div className="mx-auto grid min-h-[calc(100vh-250px)] max-w-7xl gap-5 px-4 pb-6 md:px-6 xl:grid-cols-[minmax(0,1fr)_320px]">

                {/* Chat Container */}
                <div className="min-h-[640px] bg-white/95 rounded-3xl shadow-xl overflow-hidden flex flex-col border border-white/80 backdrop-blur">

                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                            <Coffee className="text-white w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h1 className="font-bold text-white text-xl">Support Chat</h1>
                            <p className="text-sm text-white/80">BrewCraft Restaurant Support</p>
                            <p className="mt-1 text-xs text-white/70">Usually replies within 5 minutes</p>
                        </div>
                        <div className="flex w-fit items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                            <Sparkles className="w-4 h-4 text-white/80" />
                            <span className="text-white/90 text-sm font-medium">
                                {isConnected ? (adminEmail ? 'Admin online' : 'Finding admin') : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    <div className="border-b border-gray-100 bg-white/90 px-5 py-3">
                        <div className="flex gap-2 overflow-x-auto">
                            <button onClick={() => navigate('/booking')} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-teal-50 px-4 text-sm font-bold text-teal-700 hover:bg-teal-100">
                                <CalendarDays className="h-4 w-4" /> Reserve Table
                            </button>
                            <button onClick={() => navigate('/menu')} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-amber-50 px-4 text-sm font-bold text-amber-700 hover:bg-amber-100">
                                <MenuIcon className="h-4 w-4" /> View Menu
                            </button>
                            <button onClick={() => setNewMessage('Hi, what tables are available today?')} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200">
                                <Clock3 className="h-4 w-4" /> Ask Available Tables
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/70 to-white/95 sm:p-6"
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <div className="bg-teal-50 p-6 rounded-full mb-4">
                                    <MessageCircle className="w-12 h-12 text-teal-300" />
                                </div>
                                <p className="font-bold text-gray-600">{adminEmail ? 'Start a conversation with support' : "We're connecting you to an admin..."}</p>
                                <p className="mt-1 max-w-sm text-sm text-gray-400">Ask about reservations, available tables, menu items, or changes to your booking.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={msg.id || idx}
                                    className={`flex items-end gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Admin Avatar (Left) */}
                                    {!msg.isUser && (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                                            AD
                                        </div>
                                    )}

                                    <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                        <span className="text-xs text-gray-400 mb-1 px-1">{msg.sender}</span>
                                        <div
                                            className={`px-4 py-3 rounded-2xl shadow-sm ${msg.isUser
                                                ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-br-md'
                                                : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1.5 px-1">
                                            {formatTimestamp(msg.timestamp)}
                                        </span>
                                    </div>

                                    {/* User Avatar (Right) */}
                                    {msg.isUser && (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                                            You
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/95 border-t border-gray-100">
                        <div className="flex gap-2 sm:gap-3">
                            <button type="button" aria-label="Attach file" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={adminEmail ? "Type your message..." : "Waiting for admin..."}
                                className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white px-4 py-3 outline-none transition-all"
                                disabled={!adminEmail}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!adminEmail || !newMessage.trim()}
                                className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                            >
                                <Send size={18} />
                                <span className="hidden sm:inline">Send</span>
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="hidden min-h-0 space-y-4 xl:block">
                    <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-lg backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-700">
                                <Coffee className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Admin Support</h2>
                                <p className="text-sm text-gray-500">Reservation & menu help</p>
                            </div>
                        </div>
                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                                <span className="text-gray-500">Connection</span>
                                <span className={`font-bold ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>{isConnected ? 'Live' : 'Offline'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                                <span className="text-gray-500">Admin</span>
                                <span className={`font-bold ${adminEmail ? 'text-emerald-600' : 'text-amber-600'}`}>{adminEmail ? 'Available' : 'Finding'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                                <span className="text-gray-500">Response</span>
                                <span className="font-bold text-gray-800">1-5 min</span>
                            </div>
                        </div>
                    </section>
                    <section className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/95 to-amber-50/95 p-5 shadow-sm backdrop-blur">
                        <h3 className="font-bold text-gray-900">Need something fast?</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">You can book a table or review the menu while support is connecting.</p>
                        <div className="mt-4 grid gap-2">
                            <button onClick={() => navigate('/booking')} className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800">Make Reservation</button>
                            <button onClick={() => navigate('/my-bookings')} className="h-11 rounded-xl border border-teal-200 bg-white px-4 text-sm font-bold text-teal-800 hover:bg-teal-50">My Bookings</button>
                        </div>
                    </section>
                </aside>
                </div>
            </main>
        </div>
    );
};

export default UserChatPage;
