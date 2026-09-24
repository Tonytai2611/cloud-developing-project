import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AdminNavigationCountsProvider, useAdminNavigationCounts } from './useAdminNavigationCounts';
import { bookingApi } from '../../../booking/services/bookingApi';

jest.mock('../../../booking/services/bookingApi', () => ({ bookingApi: { list: jest.fn() } }));
jest.mock('../../../../hooks/useAuth', () => ({ useAuth: () => ({ user: { email: 'admin@test' } }) }));
jest.mock('../../../../config/env', () => ({ env: { websocketUrl: 'wss://test' } }));

test('keeps both badges and socket across routes; clears only viewed items', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  const originalSocket = global.WebSocket;
  const sockets = [];
  global.WebSocket = class {
    static OPEN = 1;
    readyState = 1;
    send = jest.fn();
    close = jest.fn();
    constructor() { sockets.push(this); }
  };
  bookingApi.list.mockResolvedValue({ data: [{ id: 'one' }, { id: 'two' }] });
  let navigate;
  function Probe() {
    navigate = useNavigate();
    return <output>{JSON.stringify(useAdminNavigationCounts())}</output>;
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin']}><AdminNavigationCountsProvider><Probe /></AdminNavigationCountsProvider></MemoryRouter>));
    act(() => sockets[0].onmessage({ data: JSON.stringify({ type: 'conversationList', conversations: [{ userId: 'customer', unread: 2 }] }) }));
    expect(JSON.parse(container.textContent)).toEqual({ 'Bookings & Orders': 2, Chat: 2 });
    await act(async () => navigate('/admin/manage-menu'));
    expect(JSON.parse(container.textContent)).toEqual({ 'Bookings & Orders': 2, Chat: 2 });
    expect(bookingApi.list).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(1);
    await act(async () => navigate('/admin/manage-ordering-food'));
    expect(JSON.parse(container.textContent)).toEqual({ 'Bookings & Orders': 0, Chat: 2 });
    act(() => window.dispatchEvent(new CustomEvent('brewcraft:chat-read', { detail: { email: 'customer', timestamp: '2026-09-12T10:00:00Z' } })));
    expect(JSON.parse(container.textContent)).toEqual({ 'Bookings & Orders': 0, Chat: 0 });
    act(() => sockets[0].onmessage({ data: JSON.stringify({ type: 'conversationList', conversations: [{ userId: 'customer', unread: 2, lastTimestamp: '2026-09-12T09:59:00Z' }] }) }));
    expect(JSON.parse(container.textContent)).toEqual({ 'Bookings & Orders': 0, Chat: 0 });
    act(() => sockets[0].onmessage({ data: JSON.stringify({ type: 'conversationList', conversations: [{ userId: 'customer', unread: 1, lastTimestamp: '2026-09-12T10:01:00Z' }] }) }));
    expect(JSON.parse(container.textContent)).toEqual({ 'Bookings & Orders': 0, Chat: 1 });
    expect(JSON.parse(localStorage.getItem('brewcraft-admin-seen:admin@test')).orders).toHaveLength(2);
  } finally {
    act(() => root.unmount());
    expect(sockets[0].close).toHaveBeenCalled();
    global.WebSocket = originalSocket;
  }
});
