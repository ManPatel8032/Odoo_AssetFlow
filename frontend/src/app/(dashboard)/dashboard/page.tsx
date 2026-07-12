"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, Users, Wrench, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const STATUS_COLORS: Record<string, string> = {
  Available: "#22c55e",
  Allocated: "#3b82f6",
  Maintenance: "#f59e0b",
  Retired: "#ef4444",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-800">{item.name}</p>
        <p className="text-gray-500 mt-0.5">
          {item.value} asset{item.value !== 1 ? "s" : ""}{" "}
          <span className="text-gray-400">
            ({item.payload.percent !== undefined ? `${(item.payload.percent * 100).toFixed(1)}%` : ""})
          </span>
        </p>
      </div>
    );
  }
  return null;
};

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

  const pieData = [
    { name: "Available", value: data.kpis.assets_available },
    { name: "Allocated", value: data.kpis.assets_allocated },
    { name: "Maintenance", value: data.kpis.assets_maintenance },
    { name: "Retired", value: data.kpis.assets_retired },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
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
          <CardContent className="h-[300px]">
            {pieData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
                <p>No asset data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions performed on assets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {data.recent_activity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center pt-4">No recent activity</div>
              ) : (
                data.recent_activity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">{item.action.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.details || "No details provided"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-sm font-medium">{item.performed_by_name || "System"}</div>
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
