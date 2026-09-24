const express = require('express');
const crypto = require('crypto');

function createAdminRouter({ dynamodb, cognito, s3, env, tables, publishBookingEvent }) {
  const router = express.Router();
  const { users, menu, bookings, restaurantTables, notifications, analyticsSummary } = tables;

  const json = (res, data, meta) => res.json({ data, ...(meta ? { meta } : {}) });
  const error = (res, status, message, detail) => res.status(status).json({ error: message, ...(detail ? { detail } : {}) });
  const now = () => new Date().toISOString();

  function parseDateRange(query = {}, useDefaultRange = true) {
    const end = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
    const start = query.from
      ? new Date(`${query.from}T00:00:00.000Z`)
      : (useDefaultRange && end ? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000) : null);
    if (!start) return null;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null;
    return { start, end };
  }

  function valueDate(item) {
    const raw = item.createdAt || item.updatedAt || (item.date && `${item.date}T${item.time || '00:00'}:00Z`);
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  async function scanAll(TableName, params = {}) {
    if (!TableName) return [];
    const items = [];
    let ExclusiveStartKey;
    do {
      const response = await dynamodb.scan({ TableName, ...params, ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}) }).promise();
      items.push(...(response.Items || []));
      ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  function paginate(items, query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const start = (page - 1) * limit;
    return { data: items.slice(start, start + limit), meta: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) } };
  }

  function normalizeMenu(item) {
    return {
      ...item,
      name: item.name || item.title || item.dishes || '',
      imageUrl: item.imageUrl || item.image || '',
      available: item.available !== false,
      updatedAt: item.updatedAt || null,
    };
  }

  async function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || '';
    if (!auth.toLowerCase().startsWith('bearer ')) return error(res, 401, 'Missing or invalid authorization header');
    const token = auth.slice(7).trim();
    if (!token) return error(res, 401, 'Missing access token');
    try {
      const user = await cognito.getUser({ AccessToken: token }).promise();
      const attrs = Object.fromEntries((user.UserAttributes || []).map((item) => [item.Name, item.Value]));
      const groups = await cognito.adminListGroupsForUser({ UserPoolId: env.cognitoUserPoolId, Username: user.Username }).promise();
      const groupNames = (groups.Groups || []).map((group) => group.GroupName);
      let dbUser = null;
      if (users) {
        const result = await dynamodb.get({ TableName: users, Key: { id: String(user.Username).toLowerCase() } }).promise();
        dbUser = result.Item || null;
      }
      const isAdmin = groupNames.includes(env.adminGroupName) || attrs['custom:role'] === 'admin' || dbUser?.role === 'admin' || dbUser?.isAdmin === true;
      if (!isAdmin) return error(res, 403, 'Admin access required');
      req.admin = { username: user.Username, email: attrs.email || dbUser?.email || user.Username, groups: groupNames };
      return next();
    } catch (err) {
      return error(res, 401, 'Invalid or expired access token', err.message);
    }
  }

  router.use(requireAdmin);

  async function getBookings(query = {}, options = {}) {
    let items = await scanAll(bookings);
    const range = parseDateRange(query, options.defaultRange !== false);
    if (range) items = items.filter((item) => { const date = valueDate(item); return !date || (date >= range.start && date <= range.end); });
    if (query.status) items = items.filter((item) => String(item.status || '').toUpperCase() === String(query.status).toUpperCase());
    if (query.search) {
      const term = String(query.search).toLowerCase();
      items = items.filter((item) => `${item.id} ${item.customerName} ${item.email} ${(item.selectedItems || []).map((x) => x.name || x.title).join(' ')}`.toLowerCase().includes(term));
    }
    items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return items;
  }

  function isOrder(item) { return Number(item.totalPrice || item.total || 0) > 0 || (item.selectedItems || []).length > 0; }
  function isReservation(item) { return !isOrder(item); }
  function percentChange(current, previous) {
    if (!previous) return current ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  router.get('/dashboard/summary', async (req, res) => {
    try {
      const items = await getBookings(req.query);
      const range = parseDateRange(req.query);
      if (!range) return error(res, 400, 'Invalid date range');
      const orders = items.filter(isOrder);
      const reservations = items.filter(isReservation);
      const today = new Date().toISOString().slice(0, 10);
      const todayReservations = reservations.filter((item) => item.date === today);
      const status = (item) => String(item.status || 'PENDING').toUpperCase();
      const revenue = orders.reduce((sum, item) => sum + Number(item.totalPrice || item.total || 0), 0);
      const recentOrders = items.slice(0, 5).map((item) => ({ id: item.id, item: (item.selectedItems || []).map((x) => x.name || x.title).join(' + ') || 'Table reservation', time: item.createdAt, status: status(item), total: Number(item.totalPrice || item.total || 0) }));
      const revenueSeries = {};
      orders.forEach((item) => { const date = valueDate(item); if (date) { const key = date.toISOString().slice(0, 10); revenueSeries[key] = (revenueSeries[key] || 0) + Number(item.totalPrice || item.total || 0); } });
      const next = reservations.filter((item) => status(item) === 'CONFIRMED' && `${item.date}T${item.time}` >= new Date().toISOString().slice(0, 16)).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0] || null;
      const previousEnd = new Date(range.start.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - (range.end.getTime() - range.start.getTime()));
      const previousItems = await getBookings({ from: previousStart.toISOString().slice(0, 10), to: previousEnd.toISOString().slice(0, 10) });
      const previousOrders = previousItems.filter(isOrder);
      const previousRevenue = previousOrders.reduce((sum, item) => sum + Number(item.totalPrice || item.total || 0), 0);
      let projectedStats = null;
      if (analyticsSummary) {
        try {
          const summaries = await scanAll(analyticsSummary, { FilterExpression: 'begins_with(#pk, :prefix)', ExpressionAttributeNames: { '#pk': 'pk' }, ExpressionAttributeValues: { ':prefix': 'DAILY#' } });
          const range = parseDateRange(req.query);
          const selected = summaries.filter((item) => { const date = new Date(`${String(item.pk).slice(6)}T00:00:00.000Z`); return !range || (date >= range.start && date <= range.end); });
          if (selected.length) {
            const sum = (field) => selected.reduce((total, item) => total + Number(item[field] || 0), 0);
            projectedStats = { totalOrders: sum('totalOrders'), pendingOrders: sum('pendingOrders'), completedOrders: sum('completedOrders'), revenue: sum('estimatedRevenue'), ordersChangePercent: 0, revenueChangePercent: 0 };
          }
        } catch (aggregateError) {
          // Aggregate data is an optimization. A missing table or IAM permission
          // must not hide the source bookings from the admin dashboard.
          console.warn('Analytics aggregate unavailable; using bookings fallback:', aggregateError.message);
        }
      }
      const calculatedStats = {
        totalBookings: items.length,
        foodOrders: orders.length,
        revenue,
        todayReservations: todayReservations.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((x) => ['PENDING', 'PREPARING'].includes(status(x))).length,
        completedOrders: orders.filter((x) => ['COMPLETED', 'CONFIRMED'].includes(status(x))).length,
        ordersChangePercent: percentChange(items.length, previousItems.length),
        revenueChangePercent: percentChange(revenue, previousRevenue),
      };
      if (projectedStats) {
        projectedStats.totalBookings = items.length;
        projectedStats.foodOrders = projectedStats.totalOrders;
        projectedStats.todayReservations = todayReservations.length;
        projectedStats.ordersChangePercent = percentChange(projectedStats.totalBookings, previousItems.length);
        projectedStats.revenueChangePercent = percentChange(projectedStats.revenue, previousRevenue);
      }
      return json(res, {
        stats: projectedStats || calculatedStats,
        recentOrders,
        revenueSeries: Object.entries(revenueSeries).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value })),
        reservations: { total: todayReservations.length, confirmed: todayReservations.filter((x) => status(x) === 'CONFIRMED').length, pending: todayReservations.filter((x) => status(x) === 'PENDING').length, cancelled: todayReservations.filter((x) => ['CANCELLED', 'REJECTED'].includes(status(x))).length, next },
        counts: { pendingOrders: orders.filter((x) => ['PENDING', 'PREPARING'].includes(status(x))).length, unreadChats: 0, unreadNotifications: notifications ? (await scanAll(notifications)).filter((x) => !x.read).length : 0 },
      });
    } catch (err) { return error(res, 500, 'Failed to build dashboard summary', err.message); }
  });

  async function listBookings(req, res, predicate) {
    try { const result = paginate((await getBookings(req.query, { defaultRange: false })).filter(predicate), req.query); return json(res, result.data, result.meta); }
    catch (err) { return error(res, 500, 'Failed to read bookings', err.message); }
  }
  router.get('/orders', (req, res) => listBookings(req, res, isOrder));
  router.get('/reservations', (req, res) => listBookings(req, res, isReservation));
  router.get('/orders/:id', async (req, res) => { try { const result = await dynamodb.get({ TableName: bookings, Key: { id: String(req.params.id) } }).promise(); if (!result.Item) return error(res, 404, 'Order not found'); return json(res, result.Item); } catch (err) { return error(res, 500, 'Failed to read order', err.message); } });
  router.patch('/orders/:id', updateBooking);
  router.patch('/reservations/:id', updateBooking);
  router.patch('/orders/:id/status', updateBookingStatus);
  router.patch('/reservations/:id/status', updateBookingStatus);
  async function updateBooking(req, res) {
    const allowed = ['customerName', 'phone', 'email', 'guests', 'tableId', 'tableNumber', 'date', 'time', 'specialRequests', 'selectedItems'];
    const fields = Object.fromEntries(Object.entries(req.body || {}).filter(([key, value]) => allowed.includes(key) && value !== undefined));
    if (!Object.keys(fields).length) return error(res, 400, 'Nothing to update');
    if (fields.guests !== undefined) fields.guests = Number(fields.guests);
    if (fields.selectedItems !== undefined) {
      if (!Array.isArray(fields.selectedItems)) return error(res, 400, 'selectedItems must be an array');
      fields.total = fields.selectedItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
      fields.totalPrice = fields.total;
    }
    const names = {};
    const values = { ':updatedAt': now() };
    const parts = ['updatedAt = :updatedAt'];
    Object.entries(fields).forEach(([key, value], index) => {
      const name = `#f${index}`;
      const val = `:v${index}`;
      names[name] = key;
      values[val] = value;
      parts.push(`${name} = ${val}`);
    });
    try {
      const response = await dynamodb.update({ TableName: bookings, Key: { id: String(req.params.id) }, UpdateExpression: `SET ${parts.join(', ')}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ReturnValues: 'ALL_NEW' }).promise();
      await publishBookingEvent('BOOKING_UPDATED', response.Attributes || {});
      return json(res, response.Attributes || {});
    } catch (err) { return error(res, 500, 'Failed to update booking', err.message); }
  }
  async function updateBookingStatus(req, res) {
    const status = String(req.body?.status || '').toUpperCase();
    if (!['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) return error(res, 400, 'Invalid booking status');
    try { const response = await dynamodb.update({ TableName: bookings, Key: { id: String(req.params.id) }, UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':status': status, ':updatedAt': now() }, ReturnValues: 'ALL_NEW' }).promise(); await publishBookingEvent('BOOKING_UPDATED', response.Attributes || {}); return json(res, response.Attributes || {}); } catch (err) { return error(res, 500, 'Failed to update booking status', err.message); }
  }
  async function deleteBooking(req, res) { try { await dynamodb.delete({ TableName: bookings, Key: { id: String(req.params.id) } }).promise(); return json(res, { id: req.params.id }); } catch (err) { return error(res, 500, 'Failed to delete booking', err.message); } }
  router.delete('/orders/:id', deleteBooking);

  router.get('/tables', async (req, res) => { try { return json(res, await scanAll(restaurantTables)); } catch (err) { return error(res, 500, 'Failed to read tables', err.message); } });
  router.post('/tables', async (req, res) => { const data = { ...(req.body || {}), id: String(req.body?.id || `TBL-${crypto.randomUUID()}`), createdAt: now(), updatedAt: now(), status: req.body?.status || 'AVAILABLE' }; if (!data.tableNumber || !data.seats) return error(res, 400, 'tableNumber and seats are required'); try { await dynamodb.put({ TableName: restaurantTables, Item: data }).promise(); return res.status(201).json({ data }); } catch (err) { return error(res, 500, 'Failed to create table', err.message); } });
  router.patch('/tables/:id', updateTable);
  router.patch('/tables/:id/status', updateTable);
  async function updateTable(req, res) { const data = req.body || {}; const fields = Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'id' && data[key] !== undefined)); if (!Object.keys(fields).length) return error(res, 400, 'Nothing to update'); const names = {}; const values = {}; const parts = Object.entries(fields).map(([key, value], index) => { const name = `#f${index}`; const val = `:v${index}`; names[name] = key; values[val] = value; return `${name} = ${val}`; }); parts.push('updatedAt = :updatedAt'); values[':updatedAt'] = now(); try { const result = await dynamodb.update({ TableName: restaurantTables, Key: { id: String(req.params.id) }, UpdateExpression: `SET ${parts.join(', ')}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ReturnValues: 'ALL_NEW' }).promise(); return json(res, result.Attributes || {}); } catch (err) { return error(res, 500, 'Failed to update table', err.message); } }
  router.delete('/tables/:id', async (req, res) => { try { await dynamodb.delete({ TableName: restaurantTables, Key: { id: String(req.params.id) } }).promise(); return json(res, { id: req.params.id }); } catch (err) { return error(res, 500, 'Failed to delete table', err.message); } });

  router.get('/menu', async (req, res) => { try { return json(res, (await scanAll(menu)).map(normalizeMenu)); } catch (err) { return error(res, 500, 'Failed to read menu', err.message); } });
  router.get('/menu/:id', async (req, res) => { try { const result = await dynamodb.get({ TableName: menu, Key: { id: String(req.params.id) } }).promise(); if (!result.Item) return error(res, 404, 'Menu item not found'); return json(res, normalizeMenu(result.Item)); } catch (err) { return error(res, 500, 'Failed to read menu item', err.message); } });
  router.post('/menu', createMenu);
  router.patch('/menu/:id', updateMenu);
  router.patch('/menu/:id/availability', updateMenu);
  router.delete('/menu/:id', async (req, res) => { try { await dynamodb.delete({ TableName: menu, Key: { id: String(req.params.id) } }).promise(); return json(res, { id: req.params.id }); } catch (err) { return error(res, 500, 'Failed to delete menu item', err.message); } });
  async function createMenu(req, res) { const data = { ...(req.body || {}), id: String(req.body?.id || `MENU-${crypto.randomUUID()}`), createdAt: now(), updatedAt: now() }; data.title = data.title || data.name; data.dishes = data.dishes || data.name; if (!data.name && !data.title) return error(res, 400, 'name is required'); try { await dynamodb.put({ TableName: menu, Item: data }).promise(); return res.status(201).json({ data: normalizeMenu(data) }); } catch (err) { return error(res, 500, 'Failed to create menu item', err.message); } }
  async function updateMenu(req, res) { const fields = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => key !== 'id' && req.body[key] !== undefined)); fields.updatedAt = now(); const names = {}; const values = {}; const parts = Object.entries(fields).map(([key, value], index) => { const name = `#f${index}`; const val = `:v${index}`; names[name] = key; values[val] = value; return `${name} = ${val}`; }); try { const result = await dynamodb.update({ TableName: menu, Key: { id: String(req.params.id) }, UpdateExpression: `SET ${parts.join(', ')}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ReturnValues: 'ALL_NEW' }).promise(); return json(res, normalizeMenu(result.Attributes || {})); } catch (err) { return error(res, 500, 'Failed to update menu item', err.message); } }
  router.post('/menu/images/presign', async (req, res) => { if (!s3 || !env.imageBucket) return error(res, 501, 'Image storage is not configured'); const fileName = String(req.body?.fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_'); const key = `menu/${Date.now()}_${fileName}`; return json(res, { key, uploadUrl: s3.getSignedUrl('putObject', { Bucket: env.imageBucket, Key: key, ContentType: req.body?.contentType || 'application/octet-stream', Expires: 300 }), imageUrl: `/images/${encodeURIComponent(key)}` }); });

  router.get('/customers', async (req, res) => { try { let items = await scanAll(users); if (req.query.search) { const term = String(req.query.search).toLowerCase(); items = items.filter((x) => `${x.name} ${x.email} ${x.username}`.toLowerCase().includes(term)); } return json(res, ...Object.values(paginate(items, req.query))); } catch (err) { return error(res, 500, 'Failed to read customers', err.message); } });
  router.get('/customers/:id', async (req, res) => { try { const result = await dynamodb.get({ TableName: users, Key: { id: String(req.params.id).toLowerCase() } }).promise(); if (!result.Item) return error(res, 404, 'Customer not found'); return json(res, result.Item); } catch (err) { return error(res, 500, 'Failed to read customer', err.message); } });
  router.patch('/customers/:id/status', async (req, res) => { try { const result = await dynamodb.update({ TableName: users, Key: { id: String(req.params.id).toLowerCase() }, UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':status': req.body?.status || 'active', ':updatedAt': now() }, ReturnValues: 'ALL_NEW' }).promise(); return json(res, result.Attributes || {}); } catch (err) { return error(res, 500, 'Failed to update customer status', err.message); } });
  router.get('/customers/:id/orders', (req, res) => listBookings({ ...req, query: { ...req.query, search: req.params.id } }, res, isOrder));
  router.get('/customers/:id/reservations', (req, res) => listBookings({ ...req, query: { ...req.query, search: req.params.id } }, res, isReservation));

  async function analytics(req, res) { try { const items = await getBookings(req.query); const orders = items.filter(isOrder); const reservations = items.filter(isReservation); const revenue = orders.reduce((sum, x) => sum + Number(x.totalPrice || x.total || 0), 0); return json(res, { orders: orders.length, reservations: reservations.length, revenue, averageOrderValue: orders.length ? revenue / orders.length : 0, completedOrders: orders.filter((x) => ['COMPLETED', 'CONFIRMED'].includes(String(x.status).toUpperCase())).length }); } catch (err) { return error(res, 500, 'Failed to read analytics', err.message); } }
  router.get('/analytics/overview', analytics);
  router.get('/analytics/revenue', async (req, res) => { try { const items = (await getBookings(req.query)).filter(isOrder); const grouped = {}; items.forEach((x) => { const date = valueDate(x); if (date) { const key = date.toISOString().slice(0, req.query.groupBy === 'month' ? 7 : 10); grouped[key] = (grouped[key] || 0) + Number(x.totalPrice || x.total || 0); } }); return json(res, Object.entries(grouped).map(([period, value]) => ({ period, value }))); } catch (err) { return error(res, 500, 'Failed to read revenue analytics', err.message); } });
  router.get('/analytics/orders', analytics);
  router.get('/analytics/menu-performance', analytics);
  router.get('/analytics/tables', analytics);
  router.get('/analytics/customers', analytics);

  router.get('/notifications', async (req, res) => { try { return json(res, notifications ? await scanAll(notifications) : []); } catch (err) { return error(res, 500, 'Failed to read notifications', err.message); } });
  router.get('/notifications/unread-count', async (req, res) => { try { const items = notifications ? await scanAll(notifications) : []; return json(res, { count: items.filter((x) => !x.read).length }); } catch (err) { return error(res, 500, 'Failed to count notifications', err.message); } });
  router.patch('/notifications/:id/read', markNotificationRead);
  async function markNotificationRead(req, res) { if (!notifications) return json(res, { id: req.params.id, read: true }); try { const result = await dynamodb.update({ TableName: notifications, Key: { id: String(req.params.id) }, UpdateExpression: 'SET #read = :read', ExpressionAttributeNames: { '#read': 'read' }, ExpressionAttributeValues: { ':read': true }, ReturnValues: 'ALL_NEW' }).promise(); return json(res, result.Attributes || {}); } catch (err) { return error(res, 500, 'Failed to mark notification', err.message); } }
  router.patch('/notifications/read-all', async (req, res) => { const items = notifications ? await scanAll(notifications) : []; if (notifications) { await Promise.all(items.filter((x) => !x.read).map((x) => dynamodb.update({ TableName: notifications, Key: { id: String(x.id) }, UpdateExpression: 'SET #read = :read', ExpressionAttributeNames: { '#read': 'read' }, ExpressionAttributeValues: { ':read': true } }).promise())); } return json(res, { updated: items.filter((x) => !x.read).length }); });

  router.get('/settings', async (req, res) => { try { const result = users ? await dynamodb.get({ TableName: users, Key: { id: String(req.admin.username).toLowerCase() } }).promise() : {}; return json(res, { profile: result.Item || { email: req.admin.email }, restaurant: {}, notifications: {} }); } catch (err) { return error(res, 500, 'Failed to read settings', err.message); } });
  router.patch('/settings/profile', async (req, res) => { const allowed = ['name', 'email', 'avatarUrl']; const data = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key))); if (!Object.keys(data).length) return error(res, 400, 'No profile fields to update'); const update = Object.entries(data); try { const result = await dynamodb.update({ TableName: users, Key: { id: String(req.admin.username).toLowerCase() }, UpdateExpression: `SET ${update.map(([key], i) => `#f${i} = :v${i}`).join(', ')}`, ExpressionAttributeNames: Object.fromEntries(update.map(([key], i) => [`#f${i}`, key])), ExpressionAttributeValues: Object.fromEntries(update.map(([key, value], i) => [`:v${i}`, value])), ReturnValues: 'ALL_NEW' }).promise(); return json(res, result.Attributes || {}); } catch (err) { return error(res, 500, 'Failed to update profile', err.message); } });
  router.patch('/settings/restaurant', (req, res) => json(res, req.body || {}));
  router.patch('/settings/notifications', (req, res) => json(res, req.body || {}));

  return router;
}

module.exports = { createAdminRouter };
