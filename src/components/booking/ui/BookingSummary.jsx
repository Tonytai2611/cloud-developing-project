import React from 'react';
import { Calendar, Clock, Globe, UtensilsCrossed } from 'lucide-react';

export default function BookingSummary({ selectedDate, selectedTime, selectedItems, totalPrice }) {
  return (
    <div className="lg:w-1/3 bg-gradient-to-br from-teal-600 to-teal-700 p-8 text-white">
      <div className="sticky top-8">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-10 h-10 text-white" />
        </div>
        <p className="text-teal-200 text-sm mb-1">BrewCraft Restaurant</p>
        <h2 className="text-2xl font-bold mb-4">Table Reservation</h2>

        <div className="flex items-center gap-2 text-teal-100 mb-6">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Duration: ~2 hours</span>
        </div>

        <p className="text-teal-100 text-sm leading-relaxed mb-8">
          Reserve your perfect dining experience at BrewCraft.
          Enjoy our exquisite cuisine and warm atmosphere.
        </p>

        {(selectedDate || selectedTime || selectedItems.length > 0) && (
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h4 className="font-semibold mb-3">Your Selection</h4>
            {selectedDate && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                <span>{selectedDate.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
              </div>
            )}
            {selectedTime && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>{selectedTime}</span>
              </div>
            )}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <UtensilsCrossed className="w-4 h-4" />
                <span>{selectedItems.length} items - ${(totalPrice / 1000).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-teal-200 text-sm">
          <Globe className="w-4 h-4" />
          <span>Vietnam Time (GMT+7)</span>
        </div>
      </div>
    </div>
  );
}
