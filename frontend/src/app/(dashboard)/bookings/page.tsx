import CalendarView from "@/components/bookings/CalendarView";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bookings Calendar</h1>
      <CalendarView />
    </div>
  );
}
