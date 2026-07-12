"use client";

import { useState, useEffect } from "react";
import BookingForm from "../../../components/bookings/BookingForm";
import { format } from "date-fns";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to cancel booking", error);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const bDate = new Date(b.start_time);
    return bDate.getFullYear() === selectedDate.getFullYear() &&
           bDate.getMonth() === selectedDate.getMonth() &&
           bDate.getDate() === selectedDate.getDate();
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resource Bookings</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">Select Date</h2>
          <input 
            type="date" 
            className="w-full border p-2 rounded"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Bookings for {format(selectedDate, 'MMM dd, yyyy')}</h2>
          
          {loading ? (
            <p>Loading...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-lg border border-dashed text-center">
              No bookings for this date.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{booking.asset_name}</h3>
                    <p className="text-sm text-gray-500">Booked by: {booking.employee_name}</p>
                    <p className="text-sm font-medium mt-1">
                      {format(new Date(booking.start_time), 'hh:mm a')} - {format(new Date(booking.end_time), 'hh:mm a')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCancel(booking.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 hover:bg-red-50 px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <BookingForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            setIsFormOpen(false);
            fetchBookings();
          }} 
        />
      )}
    </div>
  );
}
