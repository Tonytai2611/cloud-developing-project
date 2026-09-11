/* Hallmark · pre-emit critique: P4 H5 E5 S5 R5 V4 */
import React from 'react';
import { ChevronRight, Clock3, MessageCircle, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminWorkspaceShell from '../../shared/AdminWorkspaceShell';
import { useAdminChat } from '../hooks/useAdminChat';
import ChatThread from './ChatThread';
import ConversationList from './ConversationList';
import CustomerSummary from './CustomerSummary';

export default function ChatManagementPage() {
  const navigate = useNavigate();
  const chat = useAdminChat();
  const statCards = [{ label: 'Connection', value: chat.isConnected ? 'Live' : 'Offline', icon: Radio, tone: chat.isConnected ? 'emerald' : 'red' }, { label: 'Conversations', value: chat.stats.total, icon: MessageCircle, tone: 'blue' }, { label: 'Online', value: chat.stats.online, icon: Radio, tone: 'emerald' }, { label: 'Unread', value: chat.stats.unread, icon: Clock3, tone: 'amber' }];
  const tones = { emerald: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700' };
  return <AdminWorkspaceShell query={chat.searchTerm} setQuery={chat.setSearchTerm} searchPlaceholder="Search conversations…" title="Chat with Users" subtitle="Respond to customer questions and messages."><div className="space-y-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><nav className="mb-2 flex items-center gap-2 text-sm text-slate-500"><button onClick={() => navigate('/admin')} className="hover:text-teal-700">Dashboard</button><ChevronRight className="h-4 w-4" /><span className="text-teal-700">Chat with Users</span></nav><h1 className="font-serif text-4xl font-bold text-slate-950">Chat with Users</h1><p className="mt-1 text-slate-500">Respond to customer questions and reservation messages.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{statCards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="flex min-w-32 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span><div><p className="text-lg font-black text-slate-950">{value}</p><p className="whitespace-nowrap text-xs text-slate-500">{label}</p></div></article>)}</div></div>{chat.notification && <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800"><span>{chat.notification}</span><button onClick={() => chat.setNotification(null)} className="ml-4 text-teal-900">Dismiss</button></div>}<div className="grid min-h-[680px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_270px]"><ConversationList chat={chat} /><ChatThread chat={chat} /><CustomerSummary chat={chat} /></div></div></AdminWorkspaceShell>;
}
