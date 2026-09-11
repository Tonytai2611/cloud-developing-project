import { env } from '../../../config/env';

// Booking API Service
const API_BASE_URL = env.apiBaseUrl;

async function parseApiResponse(response, fallbackMessage) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        await response.text();
        throw new Error('Booking API returned a non-JSON response. Check that the backend is running and /createBooking is proxied correctly.');
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || result.message || fallbackMessage);
    }

    return result;
}

export const bookingApi = {
    list: async (userId = null) => {
        try {
            const url = userId
                ? `${API_BASE_URL}/getBooking?userId=${userId}`
                : `${API_BASE_URL}/getBooking`;

            const response = await fetch(url);
            const result = await parseApiResponse(response, 'Failed to fetch bookings');
            return { success: true, data: result.data || [] };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/createBooking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await parseApiResponse(response, 'Failed to create booking');
            return { success: true, data: result.data };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    updateStatus: async (id, status, tableId = null) => {
        try {
            const payload = { id, status };
            if (tableId) payload.tableId = tableId;

            const response = await fetch(`${API_BASE_URL}/updateBooking`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await parseApiResponse(response, 'Failed to update booking');
            return { success: true, data: result.data, message: result.message };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/deleteBooking`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            await parseApiResponse(response, 'Failed to delete booking');
            return { success: true };
        } catch (error) {
            throw new Error(error.message);
        }
    }
};
