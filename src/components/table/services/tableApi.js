import { env } from '../../../config/env';

// Table API Service
const API_BASE_URL = env.apiBaseUrl;

async function parseApiResponse(response, fallbackMessage) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        await response.text();
        throw new Error('Table API returned a non-JSON response. Check that the backend is running and API routes are proxied correctly.');
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || result.message || fallbackMessage);
    }

    return result;
}

export const tableApi = {
    list: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getTable`);
            const result = await parseApiResponse(response, 'Failed to fetch tables');
            return { success: true, data: result.data || [] };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/createTable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await parseApiResponse(response, 'Failed to create table');
            return { success: true, data: result.data };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/updateTable`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id })
            });
            const result = await parseApiResponse(response, 'Failed to update table');
            return { success: true, data: result.data };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/deleteTable`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            await parseApiResponse(response, 'Failed to delete table');
            return { success: true };
        } catch (error) {
            throw new Error(error.message);
        }
    }
};
