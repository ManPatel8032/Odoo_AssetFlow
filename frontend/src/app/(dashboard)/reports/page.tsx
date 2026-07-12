"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, LayoutDashboard, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/utilization`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = async (endpoint: string, filename: string, reportId: string) => {
    setExportingReport(reportId);
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/${endpoint}`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert(`Failed to export ${filename}`);
    } finally {
      setExportingReport(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Utilization, maintenance frequency, and asset health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilization by department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.utilizationByDepartment?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.utilizationByDepartment}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      dataKey="count"
                      nameKey="name"
                      labelLine={false}
                    >
                      {stats.utilizationByDepartment.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} assets`, 'Allocated']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No utilization data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Frequency Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.maintenanceFrequency?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.maintenanceFrequency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" name="Tickets" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No maintenance data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Used Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">Most used assets</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.mostUsedAssets?.length > 0 ? (
              <ul className="space-y-3">
                {stats.mostUsedAssets.map((asset: any, i: number) => (
                  <li key={i} className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">{asset.name} <span className="text-gray-500 font-normal">({asset.tag})</span></span>
                    <span className="text-gray-500">{asset.uses} uses this month</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 text-sm">No usage data</div>
            )}
          </CardContent>
        </Card>

        {/* Idle Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">Idle assets</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.idleAssets?.length > 0 ? (
              <ul className="space-y-3">
                {stats.idleAssets.map((asset: any, i: number) => (
                  <li key={i} className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">{asset.name} <span className="text-gray-500 font-normal">({asset.tag})</span></span>
                    <span className="text-gray-500 text-amber-600">unused for {asset.idle_days || 0} days</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 text-sm">No idle assets</div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Due */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">Assets due for maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.maintenanceDue?.length > 0 || stats?.nearingRetirement?.length > 0 ? (
              <ul className="space-y-3">
                {stats?.maintenanceDue?.map((asset: any, i: number) => (
                  <li key={`m-${i}`} className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">{asset.name} <span className="text-gray-500 font-normal">({asset.tag})</span></span>
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> service due in {Math.max(0, asset.days_until)} days
                    </span>
                  </li>
                ))}
                {stats?.nearingRetirement?.map((asset: any, i: number) => (
                  <li key={`r-${i}`} className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">{asset.name} <span className="text-gray-500 font-normal">({asset.tag})</span></span>
                    <span className="text-gray-500">{asset.age_years} years old : nearing retirement</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 text-sm">No assets due for maintenance</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card className="mt-8 bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Export Reports</CardTitle>
          <CardDescription>Download raw CSV data for detailed analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              className="bg-white"
              onClick={() => handleExport('export', 'asset_inventory.csv', 'inventory')}
              disabled={exportingReport !== null}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-500" />
              {exportingReport === 'inventory' ? 'Exporting...' : 'Asset Inventory'}
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-white"
              onClick={() => handleExport('export-maintenance', 'maintenance_history.csv', 'maintenance')}
              disabled={exportingReport !== null}
            >
              <FileText className="w-4 h-4 mr-2 text-orange-500" />
              {exportingReport === 'maintenance' ? 'Exporting...' : 'Maintenance History'}
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-white"
              onClick={() => handleExport('export-discrepancies', 'audit_discrepancies.csv', 'discrepancies')}
              disabled={exportingReport !== null}
            >
              <LayoutDashboard className="w-4 h-4 mr-2 text-red-500" />
              {exportingReport === 'discrepancies' ? 'Exporting...' : 'Audit Discrepancies'}
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-white"
              onClick={() => handleExport('export-compliance', 'audit_compliance.csv', 'compliance')}
              disabled={exportingReport !== null}
            >
              <LayoutDashboard className="w-4 h-4 mr-2 text-green-500" />
              {exportingReport === 'compliance' ? 'Exporting...' : 'Audit Compliance'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
