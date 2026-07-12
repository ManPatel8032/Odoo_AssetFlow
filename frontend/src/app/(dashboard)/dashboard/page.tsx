"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BarChart3, Package, Users, Wrench, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth } from "@/lib/api";

interface DashboardData {
  kpis: {
    assets_available: number;
    assets_allocated: number;
    assets_maintenance: number;
    assets_retired: number;
    assets_total: number;
    active_bookings: number;
    pending_transfers: number;
    overdue_returns: number;
    upcoming_returns: number;
    maintenance_today: number;
  };
  recent_activity: {
    id: string;
    action: string;
    details: string;
    created_at: string;
    performed_by_name: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/kpis`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Failed to fetch dashboard data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-red-500">Failed to load dashboard data.</div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Assets",
      value: data.kpis.assets_total.toString(),
      description: `${data.kpis.assets_available} available`,
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Allocated",
      value: data.kpis.assets_allocated.toString(),
      description: `${data.kpis.overdue_returns} overdue returns`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "In Maintenance",
      value: data.kpis.assets_maintenance.toString(),
      description: `${data.kpis.maintenance_today} added today`,
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Utilization Rate",
      value: data.kpis.assets_total > 0 
        ? `${Math.round((data.kpis.assets_allocated / data.kpis.assets_total) * 100)}%` 
        : "0%",
      description: "Allocated vs Total",
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Asset Utilization Overview</CardTitle>
            <CardDescription>Visual breakdown of asset statuses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[300px] flex items-center justify-center border-t">
            {/* Placeholder for actual chart (e.g., Recharts) */}
            <div className="text-muted-foreground flex flex-col items-center">
              <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
              <p>Chart Data Visualization</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions performed on assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {data.recent_activity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center pt-4">No recent activity</div>
              ) : (
                data.recent_activity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">{item.action.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.details || "No details provided"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-sm font-medium">
                        {item.performed_by_name || "System"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
