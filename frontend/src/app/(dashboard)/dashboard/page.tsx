import KpiCard from "@/components/dashboard/KpiCard";
import OverdueList from "@/components/dashboard/OverdueList";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Total Assets" value="120" />
        <KpiCard title="Allocated Assets" value="84" />
        <KpiCard title="Under Maintenance" value="5" />
      </div>
      <OverdueList />
    </div>
  );
}
