import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, User, Users, UtensilsCrossed } from 'lucide-react';

export default function BookingSuccess({
  formData,
  selectedDate,
  selectedTime,
  selectedItems,
  totalPrice,
  onGoHome,
  onViewMenu
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl mx-auto px-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Thank you for your reservation at BrewCraft.
          </p>
          <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-bold text-lg mb-4 text-teal-700">Reservation Details:</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-teal-500" />
                <span>{formData.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-teal-500" />
                <span>{selectedDate?.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-500" />
                <span>{selectedTime}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-teal-500" />
                <span>{formData.guests} guests</span>
              </div>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-5 h-5 text-teal-500" />
                  <span>Total: ${(totalPrice / 1000).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600 mb-8">
            A confirmation email has been sent to <strong className="text-teal-600">{formData.email}</strong>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={onGoHome}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Go Home
            </button>
            <button
              type="button"
              onClick={onViewMenu}
              className="px-8 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
            >
              View Menu
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
