"use client";

import { useEffect, useState } from "react";
import { 
  Package, Users, Wrench, Calendar, ArrowLeftRight, Clock, 
  AlertTriangle, Plus, BookOpen, FileText, CheckCircle2, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 animate-spin text-blue-600" />
          <span>Loading dashboard overview...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Connection Failed</h3>
        <p className="text-sm text-muted-foreground mt-2">Could not retrieve dashboard statistics. Please ensure the backend server is running.</p>
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Available",
      value: data.kpis.assets_available,
      icon: <Package className="h-5 w-5 text-green-500" />,
      bg: "hover:border-green-200 transition-all",
    },
    {
      title: "Allocated",
      value: data.kpis.assets_allocated,
      icon: <Users className="h-5 w-5 text-blue-500" />,
      bg: "hover:border-blue-200 transition-all",
    },
    {
      title: "In Maintenance",
      value: data.kpis.assets_maintenance,
      icon: <Wrench className="h-5 w-5 text-amber-500" />,
      bg: "hover:border-amber-200 transition-all",
    },
    {
      title: "Active Bookings",
      value: data.kpis.active_bookings,
      icon: <Calendar className="h-5 w-5 text-indigo-500" />,
      bg: "hover:border-indigo-200 transition-all",
    },
    {
      title: "Pending Transfers",
      value: data.kpis.pending_transfers,
      icon: <ArrowLeftRight className="h-5 w-5 text-purple-500" />,
      bg: "hover:border-purple-200 transition-all",
    },
    {
      title: "Upcoming Returns",
      value: data.kpis.upcoming_returns,
      icon: <Clock className="h-5 w-5 text-teal-500" />,
      bg: "hover:border-teal-200 transition-all",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Today's Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time status of company assets, bookings, and actions.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card, index) => (
          <Card key={index} className={`shadow-sm border-gray-150 ${card.bg}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue Alert Banner */}
      {data.kpis.overdue_returns > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 animate-bounce" />
          <div className="text-sm font-medium">
            {data.kpis.overdue_returns} asset{data.kpis.overdue_returns > 1 ? "s are" : " is"} overdue for return - flagged for follow-up
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/assets" className="w-full">
          <Button className="w-full h-12 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Register Asset
          </Button>
        </Link>
        <Link href="/bookings" className="w-full">
          <Button variant="outline" className="w-full h-12 text-sm font-medium border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            Book Resource
          </Button>
        </Link>
        <Link href="/allocations" className="w-full">
          <Button variant="outline" className="w-full h-12 text-sm font-medium border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Raise Requests
          </Button>
        </Link>
      </div>

      {/* Recent Activity List */}
      <Card className="shadow-sm border-gray-150">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {data.recent_activity.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activities logged.
              </div>
            ) : (
              data.recent_activity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900 capitalize leading-none">
                      {activity.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.details}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-medium text-gray-500 block">
                      {activity.performed_by_name || "System"}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
