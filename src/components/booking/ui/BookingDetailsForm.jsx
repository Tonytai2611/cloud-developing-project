import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, Phone, User, Users, UtensilsCrossed } from 'lucide-react';

function CapacityNotice({ tables, tableId, guests }) {
  const selectedTableData = tables.find(t => t.id === tableId);
  const guestCount = parseInt(guests);
  const capacity = selectedTableData?.seats || 0;

  if (selectedTableData && guestCount > capacity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">
              Table Capacity Notice
            </h4>
            <p className="text-sm text-amber-700">
              You've selected <span className="font-bold">{guestCount} guests</span> for a table with <span className="font-bold">{capacity} seats</span>.
              {guestCount - capacity === 1 ? (
                <span> Consider selecting a larger table or we can arrange additional seating.</span>
              ) : (
                <span> We recommend choosing a larger table or booking multiple tables for your party.</span>
              )}
            </p>
            <p className="text-xs text-amber-600 mt-2 italic">
              Tip: You can still proceed with this booking, and our staff will assist with seating arrangements.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedTableData && guestCount < capacity - 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-700">
              This table has <span className="font-bold">{capacity} seats</span> but you've selected <span className="font-bold">{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</span>.
              You might want to choose a smaller table for a more intimate setting.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

function SelectedItemsSummary({ selectedItems, totalPrice }) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <UtensilsCrossed className="w-5 h-5 text-teal-500" />
        Pre-ordered Items
      </h4>
      <div className="space-y-3">
        {selectedItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">${(item.price / 1000).toFixed(2)} x {item.quantity}</p>
              </div>
            </div>
            <p className="font-semibold text-teal-600">
              ${((item.price * item.quantity) / 1000).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
        <span className="font-semibold text-gray-800">Total:</span>
        <span className="text-xl font-bold text-teal-600">
          ${(totalPrice / 1000).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function BookingDetailsForm({
  formData,
  tables,
  user,
  loading,
  selectedItems,
  totalPrice,
  onChange,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={onChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="0909 123 456"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            disabled={!!user}
            required
            className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${user ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="guests"
              value={formData.guests}
              onChange={onChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Table *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="tableId"
              value={formData.tableId}
              onChange={onChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="">Choose table</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.tableNumber} ({table.seats} seats)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <CapacityNotice tables={tables} tableId={formData.tableId} guests={formData.guests} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests (optional)
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={onChange}
            rows="3"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
            placeholder="E.g., Birthday celebration, dietary requirements, window seat preference..."
          />
        </div>
      </div>

      <SelectedItemsSummary selectedItems={selectedItems} totalPrice={totalPrice} />

      <button
        type="submit"
        disabled={loading || tables.length === 0}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${loading || tables.length === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-teal-500/30'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : (
          'Confirm Booking'
        )}
      </button>

      {tables.length === 0 && (
        <p className="text-center text-red-500 text-sm">
          No tables available. Please try again later.
        </p>
      )}
    </form>
  );
}
