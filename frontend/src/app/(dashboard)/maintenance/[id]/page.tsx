interface MaintenanceDetailPageProps {
  params: {
    id: string;
  };
}

export default function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Maintenance Details: {params.id}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Log details and status stepper updates.</p>
      </div>
    </div>
  );
}
