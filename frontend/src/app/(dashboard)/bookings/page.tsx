"use client";

import { useState, useEffect } from "react";
import BookingForm from "../../../components/bookings/BookingForm";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, Trash2, Check, AlertCircle, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

type Booking = {
  id: string;
  asset_id: string;
  asset_name: string;
  employee_id: string;
  employee_name: string;
  department_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
  conflict?: boolean;
};

type Asset = {
  id: string;
  name: string;
  tag: string;
};

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManageBookings = user?.role ? hasPermission(user.role, "bookings_manage") : false;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedAssetId]);

  const fetchAssets = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
        if (data.length > 0) {
          // Default to the first asset if none is selected
          setSelectedAssetId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = selectedAssetId && selectedAssetId !== "all" 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings?asset_id=${selectedAssetId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings`;
        
      const response = await fetchWithAuth(url);
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: `Booking successfully marked as ${status}` });
        fetchBookings();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to update booking status", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Booking cancelled" });
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to cancel booking", error);
    }
  };

  // Filter bookings for the selected date
  const dayBookings = bookings.filter(b => {
    const bDateStr = format(parseISO(b.start_time), 'yyyy-MM-dd');
    return bDateStr === selectedDate;
  });

  // Timeline Setup
  // Working hours from 9:00 AM (9) to 6:00 PM (18)
  const START_HOUR = 9;
  const END_HOUR = 18;
  const HOUR_HEIGHT = 90; // Pixels per hour

  const formatHourLabel = (hour: number) => {
    const h = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'pm' : 'am';
    return `${h}:00`;
  };

  // Calculate coordinates for relative layout
  const timelineHours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const getPositionForBooking = (b: Booking) => {
    const start = parseISO(b.start_time);
    const end = parseISO(b.end_time);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    const timelineStartMinutes = START_HOUR * 60;
    
    const relativeStart = startMinutes - timelineStartMinutes;
    const duration = endMinutes - startMinutes;
    
    const top = (relativeStart / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  // Detect and resolve overlapping positions dynamically so blocks don't render on top of each other
  const getRenderStyle = (b: Booking, index: number, allBookings: Booking[]) => {
    const { top, height } = getPositionForBooking(b);
    
    // Find overlapping items
    const startMs = parseISO(b.start_time).getTime();
    const endMs = parseISO(b.end_time).getTime();
    
    const overlaps = allBookings.filter(other => {
      if (other.id === b.id) return false;
      const otherStart = parseISO(other.start_time).getTime();
      const otherEnd = parseISO(other.end_time).getTime();
      return (startMs < otherEnd && endMs > otherStart);
    });

    let left = 0;
    let width = 100;

    if (overlaps.length > 0) {
      // Find our index among the overlapping group
      const sortedGroup = [b, ...overlaps].sort((x, y) => parseISO(x.start_time).getTime() - parseISO(y.start_time).getTime());
      const positionIndex = sortedGroup.findIndex(x => x.id === b.id);
      width = 100 / sortedGroup.length;
      left = positionIndex * width;
    }

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${left}%`,
      width: `calc(${width}% - 8px)`,
    };
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const formattedDateLabel = selectedDate 
    ? format(parseISO(`${selectedDate}T00:00:00`), 'EEE, d MMM') 
    : '';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-gray-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Resource Booking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Book company spaces and assets, check time schedules, and approve reservations.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm border-0 transition-colors h-11 px-5"
        >
          <Plus className="mr-2 h-5 w-5" /> Book a slot
        </Button>
      </div>

      {/* Select Resource & Date Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="bg-white border-gray-250 text-gray-900 rounded-xl h-12">
                <SelectValue placeholder="Choose a resource..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 text-gray-900">
                {assets.map(a => (
                  <SelectItem key={a.id} value={a.id} className="focus:bg-gray-50 focus:text-gray-950">
                    {a.name} ({a.tag})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border-gray-250 text-gray-900 rounded-xl h-12 focus-visible:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* Main Timeline View */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Timeline — {selectedAsset ? `${selectedAsset.name} (${selectedAsset.tag})` : 'Select Resource'} on {formattedDateLabel}
        </h2>

        {loading ? (
          <div className="py-24 text-center text-gray-400">Loading schedules...</div>
        ) : (
          <div className="relative flex min-h-[500px]">
            {/* Hours axis */}
            <div className="w-20 pr-4 flex flex-col justify-between select-none border-r border-gray-100">
              {timelineHours.map(hour => (
                <div key={hour} className="text-gray-400 font-mono text-sm font-semibold text-right h-[90px] first:h-[45px] last:h-[45px] flex items-start justify-end pt-1">
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {/* Time schedule lanes */}
            <div className="flex-1 relative ml-4 min-h-[500px]">
              {/* Horizontal grid lines */}
              {timelineHours.map((hour, idx) => (
                <div 
                  key={hour} 
                  className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
                  style={{ top: `${idx * HOUR_HEIGHT}px` }}
                />
              ))}

              {/* Day reservation blocks container */}
              <div className="absolute inset-0">
                {dayBookings.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    No slots booked or requested for this day. Click "Book a slot" to start.
                  </div>
                ) : (
                  dayBookings.map((booking, idx) => {
                    const style = getRenderStyle(booking, idx, dayBookings);
                    const isConfirmed = booking.status === 'confirmed' || booking.status === 'active';
                    const hasConflict = booking.conflict;
                    const startTimeStr = format(parseISO(booking.start_time), 'h:mm');
                    const endTimeStr = format(parseISO(booking.end_time), 'h:mm');

                    return (
                      <div
                        key={booking.id}
                        style={style}
                        className={`absolute rounded-xl p-4 transition-all flex flex-col justify-between group shadow-sm ${
                          isConfirmed
                            ? "bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
                            : hasConflict
                            ? "bg-red-50 text-red-700 border border-dashed border-red-300 hover:bg-red-100/70"
                            : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-sm leading-tight block">
                              {isConfirmed 
                                ? `Booked - ${booking.department_name || 'Procurement Team'} - ${startTimeStr} to ${endTimeStr}`
                                : `Requested ${startTimeStr} to ${endTimeStr} ${hasConflict ? ' - conflict - slot is unavailable' : ''}`
                              }
                            </span>
                            
                            {/* Actions / Admin buttons */}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isConfirmed && canManageBookings && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                  title="Approve Reservation"
                                  className="h-6 w-6 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {(canManageBookings || user?.id === booking.employee_id) && (
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  title="Cancel Booking"
                                  className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                                    isConfirmed 
                                      ? "bg-blue-750 hover:bg-red-600 text-white" 
                                      : "bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200"
                                  }`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <span className="text-xs mt-1 block opacity-85 font-medium">
                            Reserved by {booking.employee_name} ({booking.department_name || 'N/A'})
                          </span>
                        </div>

                        {hasConflict && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-650">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Conflict - Overlaps Confirmed Slot</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
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
