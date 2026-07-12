"use client";

import { AlertCircle, ArrowUpRight, BarChart3, Package, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const kpis = [
  {
    title: "Total Assets",
    value: "1,248",
    description: "+12 from last month",
    icon: <Package className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Allocated",
    value: "842",
    description: "67% of total inventory",
    icon: <Users className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "In Maintenance",
    value: "34",
    description: "12 pending approvals",
    icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Utilization Rate",
    value: "89%",
    description: "+2% from last week",
    icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
  },
];

const overdueReturns = [
  { id: "1", asset: "MacBook Pro M2", tag: "LAP-0042", employee: "John Doe", expected_return: "2023-10-15", days_overdue: 3 },
  { id: "2", asset: "Dell XPS 15", tag: "LAP-0019", employee: "Sarah Smith", expected_return: "2023-10-10", days_overdue: 8 },
  { id: "3", asset: "Ford Transit Van", tag: "VEH-0004", employee: "Mike Johnson", expected_return: "2023-10-17", days_overdue: 1 },
];

export default function DashboardPage() {
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
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Overdue Returns
            </CardTitle>
            <CardDescription>
              Assets that have passed their expected return date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueReturns.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.asset}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.tag} &bull; {item.employee}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">
                      {item.days_overdue} days
                    </div>
                    <div className="text-xs text-muted-foreground">
                      overdue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
