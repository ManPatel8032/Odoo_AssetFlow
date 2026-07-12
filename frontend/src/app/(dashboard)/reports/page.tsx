"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/export`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'asset_inventory_report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const reports = [
    {
      id: "asset-inventory",
      name: "Asset Inventory Report",
      description: "Complete list of all assets with their status, category, and assigned location.",
      icon: <FileSpreadsheet className="w-5 h-5 text-blue-500" />,
      action: handleExportCSV,
      available: true
    },
    {
      id: "maintenance-history",
      name: "Maintenance History",
      description: "Log of all maintenance tickets, repair costs, and downtime.",
      icon: <FileText className="w-5 h-5 text-orange-500" />,
      action: () => alert("This report is coming soon."),
      available: false
    },
    {
      id: "audit-compliance",
      name: "Audit Compliance Summary",
      description: "Overview of verified vs missing assets from recent audit cycles.",
      icon: <LayoutDashboard className="w-5 h-5 text-green-500" />,
      action: () => alert("This report is coming soon."),
      available: false
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Center</h1>
        <p className="text-muted-foreground mt-1">Generate and download detailed reports for your organization.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Select a report to download its raw data in CSV format.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      {report.icon}
                      <span>{report.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {report.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant={report.available ? "default" : "secondary"} 
                      onClick={report.action}
                      disabled={isExporting && report.id === "asset-inventory"}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isExporting && report.id === "asset-inventory" ? "Downloading..." : "Download CSV"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
