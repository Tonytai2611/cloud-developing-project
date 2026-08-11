// Main API Service - Re-exports all API modules
// Import individual API modules
import { menuApi } from '../components/menu/services/menuApi';
import { tableApi } from '../components/table/services/tableApi';
import { bookingApi } from '../components/booking/services/bookingApi';

// Re-export for backward compatibility
export const api = {
    menu: menuApi,
    tables: tableApi,
    bookings: bookingApi
};

// Also export individual APIs for direct import
export { menuApi, tableApi, bookingApi };
