import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BookingCalendar({ selectedDate, onSelectDate, currentMonth, setCurrentMonth }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const isDateAvailable = (date) => date && date >= today;
  const isSelected = (date) => date && selectedDate && date.toDateString() === selectedDate.toDateString();
  const isToday = (date) => date && date.toDateString() === today.toDateString();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const canGoPrev = () => {
    const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev()}
          className={`p-2 rounded-full transition-colors ${canGoPrev() ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
            }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800 min-w-[160px] text-center">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="aspect-square p-1">
            {date && (
              <button
                type="button"
                onClick={() => isDateAvailable(date) && onSelectDate(date)}
                disabled={!isDateAvailable(date)}
                className={`w-full h-full rounded-full flex items-center justify-center text-sm font-medium transition-all ${isSelected(date)
                  ? 'bg-teal-500 text-white shadow-lg'
                  : isDateAvailable(date)
                    ? 'text-teal-600 hover:bg-teal-50 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                  } ${isToday(date) && !isSelected(date) ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
