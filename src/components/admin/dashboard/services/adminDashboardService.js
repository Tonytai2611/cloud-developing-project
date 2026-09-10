import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShoppingBag,
  Table2,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { env } from '../../../../config/env';

export async function requestAdminLogout() {
  const token = localStorage.getItem('accessToken');
  if (!token || !env.apiBaseUrl) return;

  await fetch(`${env.apiBaseUrl}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => undefined);
}

export const adminNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/admin' },
  { label: 'Tables', icon: Table2, route: '/admin/manage-table' },
  { label: 'Menu', icon: UtensilsCrossed, route: '/admin/manage-menu' },
  { label: 'Orders', icon: ShoppingBag, route: '/admin/manage-ordering-food', badge: '3' },
  { label: 'Chat', icon: MessageCircle, route: '/admin/chat-with-users', badge: '5' },
];

export const secondaryNavigation = [
  { label: 'Customers', icon: Users, disabled: true },
  { label: 'Analytics', icon: BarChart3, disabled: true },
  { label: 'Settings', icon: Settings, disabled: true },
];

export const dashboardStats = [
  { label: 'Total Orders', value: '83,457', change: '+12%', icon: ShoppingBag, tone: 'teal' },
  { label: 'Pending Orders', value: '21,457', change: '+8%', icon: Clock3, tone: 'amber' },
  { label: 'Completed Orders', value: '31,457', change: '+12%', icon: CheckCircle2, tone: 'emerald' },
  { label: 'Total Revenue', value: '234,190đ', change: '+18%', icon: CircleDollarSign, tone: 'violet' },
];

export const dashboardActions = [
  { title: 'Manage Tables', description: 'Add, edit, or delete restaurant tables and manage table status.', label: 'Open Tables', route: '/admin/manage-table', icon: Table2, tone: 'teal' },
  { title: 'Manage Menu', description: 'Update menu items, categories, availability, and pricing.', label: 'Open Menu', route: '/admin/manage-menu', icon: UtensilsCrossed, tone: 'orange' },
  { title: 'Manage Orders', description: 'View and manage customer orders in real time.', label: 'Open Orders', route: '/admin/manage-ordering-food', icon: ShoppingBag, tone: 'blue' },
  { title: 'Chat with Users', description: 'Communicate with customers and handle inquiries.', label: 'Open Chat', route: '/admin/chat-with-users', icon: MessageCircle, tone: 'pink' },
];

export const recentOrders = [
  { id: '#10024', item: 'Cappuccino + Croissant', time: '2 mins ago', status: 'Completed' },
  { id: '#10023', item: 'Margherita Pizza', time: '8 mins ago', status: 'Preparing' },
  { id: '#10022', item: 'Iced Latte', time: '12 mins ago', status: 'Pending' },
  { id: '#10021', item: 'Classic Burger', time: '18 mins ago', status: 'Completed' },
];

export const reservationSummary = {
  total: 24,
  confirmed: 16,
  pending: 5,
  cancelled: 3,
  next: { time: '2:00 PM', table: 'Table 4', customer: 'Sarah Johnson', icon: CalendarDays },
};

export const filterDashboardItems = (query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return dashboardActions;
  return dashboardActions.filter((action) =>
    `${action.title} ${action.description}`.toLowerCase().includes(normalized)
  );
};
