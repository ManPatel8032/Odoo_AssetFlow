"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Transfer = {
  id: string;
  asset_id: string;
  from_employee_id: string;
  to_employee_id: string;
  status: string;
  transferred_at: string;
  asset_name: string;
  asset_tag: string;
  from_employee_name: string;
  to_employee_name: string;
};

export default function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const canApprove = user?.role === 'asset_manager' || user?.role === 'department_head';

  // For requesting new transfer
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [toEmployeeId, setToEmployeeId] = useState("");
  
  // Mock data for new transfer form
  const [allocatedAssets, setAllocatedAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchTransfers();
    fetchAllocatedAssets();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/transfers`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransfers(data);
    } catch (error) {
      toast({ title: "Error fetching transfers", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllocatedAssets = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
      if (res.ok) {
        const data = await res.json();
        // Only allocated assets can be transferred
        setAllocatedAssets(data.filter((a: any) => a.status === 'allocated'));
      }
    } catch (error) {
      console.error("Failed to fetch allocated assets", error);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/transfers/${id}/${action}`, {
        method: "PUT",
      });

      if (!res.ok) throw new Error(`Failed to ${action} transfer`);
      
      toast({ title: `Transfer ${action}d successfully` });
      fetchTransfers();
      fetchAllocatedAssets();
    } catch (error) {
      toast({ title: `Failed to ${action} transfer`, variant: "destructive" });
    }
  };

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !toEmployeeId) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId, to_employee_id: toEmployeeId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to request transfer");
      }

      toast({ title: "Transfer request submitted" });
      setIsDialogOpen(false);
      setAssetId("");
      setToEmployeeId("");
      fetchTransfers();
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/allocations">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Transfer Requests</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending & Past Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>From Employee</TableHead>
                <TableHead>To Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Loading transfers...
                  </TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No transfer requests found.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div className="font-medium text-blue-600 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {transfer.asset_tag}
                      </div>
                      <div className="text-sm text-muted-foreground">{transfer.asset_name}</div>
                    </TableCell>
                    <TableCell className="font-medium">{transfer.from_employee_name}</TableCell>
                    <TableCell className="font-medium">{transfer.to_employee_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        transfer.status === 'pending' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                        transfer.status === 'approved' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        'bg-red-50 text-red-700 ring-red-600/20'
                      }`}>
                        {transfer.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(transfer.transferred_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {transfer.status === 'pending' && canApprove && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleAction(transfer.id, 'approve')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Approve Transfer"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleAction(transfer.id, 'reject')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Reject Transfer"
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
