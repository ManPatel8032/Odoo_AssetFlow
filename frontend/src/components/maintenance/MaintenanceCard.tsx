interface MaintenanceCardProps {
  assetName: string;
  description: string;
  scheduledDate: string;
}

export default function MaintenanceCard({ assetName, description, scheduledDate }: MaintenanceCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-2">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{assetName}</h3>
        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">Scheduled</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-gray-400">Scheduled: {scheduledDate}</p>
    </div>
  );
}
