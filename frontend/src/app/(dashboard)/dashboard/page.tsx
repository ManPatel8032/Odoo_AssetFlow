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
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
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
        {user?.role === 'asset_manager' && (
          <Link href="/assets" className="w-full">
            <Button className="w-full h-12 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Register Asset
            </Button>
          </Link>
        )}
        {(user?.role === 'employee' || user?.role === 'department_head') && (
          <Link href="/bookings" className="w-full">
            <Button variant="outline" className="w-full h-12 text-sm font-medium border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              Book Resource
            </Button>
          </Link>
        )}
        {user?.role === 'employee' && (
          <Link href="/allocations" className="w-full">
            <Button variant="outline" className="w-full h-12 text-sm font-medium border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Raise Requests
            </Button>
          </Link>
        )}
      </div>

      {/* Activity & Workflow Guide Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Recent Activity List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-150 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
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
                        <p className="text-sm text-gray-600 break-words pr-2">
                          {(() => {
                            if (!activity.details) return "No details provided";
                            try {
                              const parsed = JSON.parse(activity.details);
                              if (typeof parsed === 'object' && parsed !== null) {
                                return Object.entries(parsed)
                                  .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`)
                                  .join(' • ');
                              }
                            } catch (e) {}
                            return activity.details;
                          })()}
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

        {/* Workflow Guide */}
        <div>
          <Card className="shadow-sm border-gray-150 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">System Workflow Guide</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="relative border-l border-gray-200 ml-3 pl-6 space-y-5">
                {/* Step 1 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200">1</span>
                  <h4 className="text-sm font-bold text-gray-900">Admin Org Setup</h4>
                  <p className="text-xs text-gray-500 mt-1">Admin sets up departments, categories, and promotes employees to Department Head / Asset Manager.</p>
                </div>
                {/* Step 2 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">2</span>
                  <h4 className="text-sm font-bold text-gray-900">Register Assets</h4>
                  <p className="text-xs text-gray-500 mt-1">Asset Manager registers new assets, which enter the system as <strong>Available</strong>.</p>
                </div>
                {/* Step 3 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-200">3</span>
                  <h4 className="text-sm font-bold text-gray-900">Allocation & Shared</h4>
                  <p className="text-xs text-gray-500 mt-1">Asset is allocated to user/dept (blocked if already allocated - transfer requested instead) or marked as bookable resource.</p>
                </div>
                {/* Step 4 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">4</span>
                  <h4 className="text-sm font-bold text-gray-900">Time Slot Bookings</h4>
                  <p className="text-xs text-gray-500 mt-1">Employees book shared resources by time slot; overlapping bookings are auto-rejected.</p>
                </div>
                {/* Step 5 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">5</span>
                  <h4 className="text-sm font-bold text-gray-900">Repair & Maintenance</h4>
                  <p className="text-xs text-gray-500 mt-1">Holder raises request. It must be approved before work starts and status changes to <strong>Under Maintenance</strong>.</p>
                </div>
                {/* Step 6 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200">6</span>
                  <h4 className="text-sm font-bold text-gray-900">Transfers & Returns</h4>
                  <p className="text-xs text-gray-500 mt-1">Assets are returned or transferred; overdue returns are automatically flagged by the system.</p>
                </div>
                {/* Step 7 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">7</span>
                  <h4 className="text-sm font-bold text-gray-900">Periodic Auditing</h4>
                  <p className="text-xs text-gray-500 mt-1">Audits assign auditors, verify physical assets, and auto-generate discrepancy reports before closing.</p>
                </div>
                {/* Step 8 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">8</span>
                  <h4 className="text-sm font-bold text-gray-900">Activity Tracking</h4>
                  <p className="text-xs text-gray-500 mt-1">All activity is tracked in real-time through notifications, audit logs, and analytics reports.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
