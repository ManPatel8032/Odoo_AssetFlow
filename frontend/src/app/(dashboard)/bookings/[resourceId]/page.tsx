interface BookingResourcePageProps {
  params: {
    resourceId: string;
  };
}

export default function BookingResourcePage({ params }: BookingResourcePageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Booking Details for Asset: {params.resourceId}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>View upcoming bookings and create new reservations for this asset.</p>
      </div>
    </div>
  );
}
