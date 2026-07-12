interface AuditCycleDetailPageProps {
  params: {
    cycleId: string;
  };
}

export default function AuditCycleDetailPage({ params }: AuditCycleDetailPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Audit Cycle: {params.cycleId}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Discrepancies list, items verification dashboard.</p>
      </div>
    </div>
  );
}
