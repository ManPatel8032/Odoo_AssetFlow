"use client";

import { useState, useEffect } from "react";
import BookingForm from "../../../components/bookings/BookingForm";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock, Trash2 } from "lucide-react";

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
    if (!confirm("Are you sure you want to cancel this booking?")) return;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage conference rooms, projectors, and shared assets.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          New Booking
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Filter bookings by day</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              type="date" 
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                }
              }}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Bookings for {format(selectedDate, 'MMM dd, yyyy')}</CardTitle>
            <CardDescription>Active reservations for the selected date.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                No bookings for this date.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBookings.map(booking => (
                  <div key={booking.id} className="group relative flex flex-col justify-between p-4 border rounded-lg hover:border-blue-200 hover:shadow-sm transition-all bg-white">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg leading-none">{booking.asset_name}</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCancel(booking.id)}
                          title="Cancel Booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Booked by: <span className="font-medium text-foreground">{booking.employee_name}</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium bg-blue-50 text-blue-700 p-2 rounded-md w-fit">
                      <Clock className="h-4 w-4" />
                      {format(new Date(booking.start_time), 'hh:mm a')} - {format(new Date(booking.end_time), 'hh:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BookingForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchBookings();
        }} 
      />
    </div>
  );
}
