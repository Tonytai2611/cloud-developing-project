import { env } from '../../../../config/env';

async function request(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${env.apiBaseUrl}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || result.message || `Admin API request failed (${response.status})`);
  const data = result.data === undefined ? result : result.data;
  // Accept both the current `{ data: [...] }` contract and the legacy
  // nested `{ data: { data: [...] } }` envelope during deployment rollout.
  return data && Array.isArray(data.data) ? data.data : data;
}

export const adminDashboardApi = {
  summary: (query = '') => request(`/dashboard/summary${query ? `?${query}` : ''}`),
  orders: (query = '') => request(`/orders${query ? `?${query}` : ''}`),
  reservations: (query = '') => request(`/reservations${query ? `?${query}` : ''}`),
  updateBooking: (id, data) => request(`/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateBookingStatus: (id, status) => request(`/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteBooking: (id) => request(`/orders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  tables: (query = '') => request(`/tables${query ? `?${query}` : ''}`),
  menu: (query = '') => request(`/menu${query ? `?${query}` : ''}`),
  customers: (query = '') => request(`/customers${query ? `?${query}` : ''}`),
  analytics: (path, query = '') => request(`/analytics/${path}${query ? `?${query}` : ''}`),
  notifications: (query = '') => request(`/notifications${query ? `?${query}` : ''}`),
  settings: () => request('/settings'),
};
