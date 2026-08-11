import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBookingForm } from '../components/booking/hooks/useBookingForm';
import BookingCalendar from '../components/booking/ui/BookingCalendar';
import BookingDetailsForm from '../components/booking/ui/BookingDetailsForm';
import BookingSuccess from '../components/booking/ui/BookingSuccess';
import BookingSummary from '../components/booking/ui/BookingSummary';
import TimeSlots from '../components/booking/ui/TimeSlots';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const selectedItems = location.state?.selectedItems || [];
  const selectedTable = location.state?.selectedTable;
  const {
    currentMonth,
    formData,
    handleChange,
    handleSubmit,
    loading,
    selectedDate,
    selectedTime,
    setCurrentMonth,
    setSelectedDate,
    setSelectedTime,
    setStep,
    step,
    success,
    tables,
    totalPrice
  } = useBookingForm({ user, selectedItems, selectedTable });

  if (success) {
    return (
      <BookingSuccess
        formData={formData}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedItems={selectedItems}
        totalPrice={totalPrice}
        onGoHome={() => navigate('/')}
        onViewMenu={() => navigate('/menu')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Book a Table</h1>
          <p className="text-gray-600">Select your preferred date and time</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <BookingSummary
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedItems={selectedItems}
              totalPrice={totalPrice}
            />

            <div className="lg:w-2/3 p-8">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Select a Date & Time</h3>

                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <BookingCalendar
                          selectedDate={selectedDate}
                          onSelectDate={setSelectedDate}
                          currentMonth={currentMonth}
                          setCurrentMonth={setCurrentMonth}
                        />
                      </div>

                      {selectedDate && (
                        <div className="md:w-48">
                          <TimeSlots
                            selectedTime={selectedTime}
                            onSelectTime={setSelectedTime}
                            selectedDate={selectedDate}
                          />
                        </div>
                      )}
                    </div>

                    {selectedTime && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex justify-end"
                      >
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                        >
                          Next <ArrowRight className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to calendar</span>
                    </button>

                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Enter Your Details</h3>

                    <BookingDetailsForm
                      formData={formData}
                      tables={tables}
                      user={user}
                      loading={loading}
                      selectedItems={selectedItems}
                      totalPrice={totalPrice}
                      onChange={handleChange}
                      onSubmit={handleSubmit}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
      `}</style>
    </div>
  );
}
