"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckCircle, Tag, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Allocation = {
  id: string;
  asset_id: string;
  employee_id: string;
  allocated_at: string;
  notes: string | null;
  asset_name: string;
  asset_tag: string;
  employee_name: string;
};

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");

  // Mock data for dropdowns (ideally fetched from APIs)
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([
    { id: "u1", name: "Alice Smith" },
    { id: "u2", name: "Bob Jones" },
    { id: "u3", name: "Charlie Brown" },
  ]);

  useEffect(() => {
    fetchAllocations();
    fetchAvailableAssets();
  }, []);

  const fetchAllocations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAllocations(data);
    } catch (error) {
      toast({ title: "Error fetching allocations", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
      if (res.ok) {
        const data = await res.json();
        setAvailableAssets(data.filter((a: any) => a.status === 'available'));
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !employeeId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId, employee_id: employeeId, notes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to allocate asset");
      }

      toast({ title: "Asset allocated successfully" });
      setIsDialogOpen(false);
      setAssetId("");
      setEmployeeId("");
      setNotes("");
      fetchAllocations();
      fetchAvailableAssets(); // refresh available list
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnAsset = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations/${id}/return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Returned via dashboard" }),
      });

      if (!res.ok) throw new Error("Failed to return asset");
      
      toast({ title: "Asset returned successfully" });
      fetchAllocations();
      fetchAvailableAssets();
    } catch (error) {
      toast({ title: "Failed to return asset", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Allocations</h1>
        <div className="flex gap-2">
          <Link href="/allocations/transfers">
            <Button variant="outline">
              View Transfers
            </Button>
          </Link>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Allocate Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Asset</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAllocate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset</label>
                  <Select value={assetId} onValueChange={setAssetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssets.length === 0 ? (
                        <SelectItem value="none" disabled>No assets available</SelectItem>
                      ) : (
                        availableAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.tag} - {asset.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employee</label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Input 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. New joining kit"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !assetId || !employeeId}>
                    {isSubmitting ? "Allocating..." : "Allocate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Allocated Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Loading allocations...
                  </TableCell>
                </TableRow>
              ) : allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No active allocations found.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <div className="font-medium text-blue-600 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {allocation.asset_tag}
                      </div>
                      <div className="text-sm text-muted-foreground">{allocation.asset_name}</div>
                    </TableCell>
                    <TableCell className="font-medium">{allocation.employee_name}</TableCell>
                    <TableCell>{new Date(allocation.allocated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{allocation.notes || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReturnAsset(allocation.id)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      >
                        <Undo2 className="h-4 w-4 mr-1" />
                        Return Asset
                      </Button>
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
