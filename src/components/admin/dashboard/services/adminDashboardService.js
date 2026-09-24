import {
  BarChart3,
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
  { label: 'Table Management', icon: Table2, route: '/admin/manage-table' },
  { label: 'Menu Management', icon: UtensilsCrossed, route: '/admin/manage-menu' },
  { label: 'Bookings & Orders', icon: ShoppingBag, route: '/admin/manage-ordering-food' },
  { label: 'Chat', icon: MessageCircle, route: '/admin/chat-with-users' },
];

export const secondaryNavigation = [
  { label: 'Customers', icon: Users, disabled: true },
  { label: 'Analytics', icon: BarChart3, disabled: true },
  { label: 'Settings', icon: Settings, disabled: true },
];

export const dashboardActions = [
  { title: 'Manage Tables', description: 'Add, edit, or delete restaurant tables and manage table status.', label: 'Open Tables', route: '/admin/manage-table', icon: Table2, tone: 'teal' },
  { title: 'Manage Menu', description: 'Update menu items, categories, availability, and pricing.', label: 'Open Menu', route: '/admin/manage-menu', icon: UtensilsCrossed, tone: 'orange' },
  { title: 'Bookings & Orders', description: 'Manage table bookings and food orders in one place.', label: 'Open Bookings & Orders', route: '/admin/manage-ordering-food', icon: ShoppingBag, tone: 'blue' },
  { title: 'Chat with Users', description: 'Communicate with customers and handle inquiries.', label: 'Open Chat', route: '/admin/chat-with-users', icon: MessageCircle, tone: 'pink' },
];

export const filterDashboardItems = (query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return dashboardActions;
  return dashboardActions.filter((action) =>
    `${action.title} ${action.description}`.toLowerCase().includes(normalized)
  );
};
