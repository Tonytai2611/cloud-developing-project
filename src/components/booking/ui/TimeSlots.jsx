import React from 'react';
import { motion } from 'framer-motion';

const timeSlots = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
];

export default function TimeSlots({ selectedTime, onSelectTime, selectedDate }) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {getDayName(selectedDate)}
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {timeSlots.map((time) => (
          <button
            type="button"
            key={time}
            onClick={() => onSelectTime(time)}
            className={`w-full py-3 px-4 rounded-lg border-2 text-center font-medium transition-all ${selectedTime === time
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-gray-200 hover:border-teal-500 text-teal-600'
              }`}
          >
            {formatTime(time)}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
