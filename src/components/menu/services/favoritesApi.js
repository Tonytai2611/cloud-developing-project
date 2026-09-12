import { env } from '../../../config/env';

const API_BASE_URL = env.apiBaseUrl;

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(body?.error || `Favorites API failed: ${response.status}`);
  return body || {};
};

export const favoritesApi = {
  list: async () => parseResponse(await fetch(`${API_BASE_URL}/favorites`, { credentials: 'include' })),
  save: async (dish) => parseResponse(await fetch(`${API_BASE_URL}/favorites`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dishId: dish.id, dish })
  })),
  remove: async (dishId) => parseResponse(await fetch(`${API_BASE_URL}/favorites/${encodeURIComponent(dishId)}`, {
    method: 'DELETE',
    credentials: 'include'
  }))
};
