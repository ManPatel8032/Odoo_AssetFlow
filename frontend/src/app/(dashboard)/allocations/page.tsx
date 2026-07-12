"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckCircle, Tag, Undo2, ArrowRightLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Asset = {
  id: string;
  name: string;
  tag: string;
  status: string;
};

type Employee = {
  id: string;
  name: string;
};

type AllocationHistory = {
  id: string;
  asset_id: string;
  employee_id: string;
  employee_name: string;
  department_name: string;
  allocated_at: string;
  returned_at: string | null;
  notes: string | null;
};

type ActiveAllocation = {
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
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeAllocations, setActiveAllocations] = useState<ActiveAllocation[]>([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true);
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<Asset | null>(null);
  
  const [assetHistory, setAssetHistory] = useState<AllocationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [toEmployeeId, setToEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const canAllocate = user?.role === "asset_manager";
  
  useEffect(() => {
    fetchAllAssets();
    fetchEmployees();
    fetchActiveAllocations();
  }, []);

  useEffect(() => {
    if (selectedAssetId) {
      const asset = assets.find(a => a.id === selectedAssetId);
      setSelectedAssetInfo(asset || null);
      fetchAssetHistory(selectedAssetId);
      
      // Reset form state
      setToEmployeeId("");
      setNotes("");
    } else {
      setSelectedAssetInfo(null);
      setAssetHistory([]);
    }
  }, [selectedAssetId, assets]);

  const fetchAllAssets = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    }
  };

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

  const fetchActiveAllocations = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations`);
      if (res.ok) {
        const data = await res.json();
        setActiveAllocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch allocations", error);
    } finally {
      setIsLoadingAllocations(false);
    }
  };

  const fetchAssetHistory = async (id: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations/asset/${id}/history`);
      if (res.ok) {
        const data = await res.json();
        setAssetHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch asset history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !toEmployeeId) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: selectedAssetId, employee_id: toEmployeeId, notes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to allocate asset");
      }

      toast({ title: "Asset allocated successfully" });
      setToEmployeeId("");
      setNotes("");
      fetchAllAssets(); // Refresh status
      fetchAssetHistory(selectedAssetId);
      fetchActiveAllocations();
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !toEmployeeId) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: selectedAssetId, to_employee_id: toEmployeeId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to request transfer");
      }

      toast({ title: "Transfer request submitted successfully" });
      setToEmployeeId("");
      setNotes("");
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnAsset = async (id: string, assetIdToRefresh?: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/allocations/${id}/return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Returned via dashboard" }),
      });

      if (!res.ok) throw new Error("Failed to return asset");
      
      toast({ title: "Asset returned successfully" });
      fetchActiveAllocations();
      fetchAllAssets();
      if (assetIdToRefresh) fetchAssetHistory(assetIdToRefresh);
    } catch (error) {
      toast({ title: "Failed to return asset", variant: "destructive" });
    }
  };

  const currentHolder = assetHistory.find(h => h.returned_at === null);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Allocation & Transfer</h1>
          <p className="text-muted-foreground mt-1">Allocate available assets or request transfers for allocated assets.</p>
        </div>
        <Link href="/allocations/transfers">
          <Button variant="outline" className="h-10 rounded-xl">
            View Transfers
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm border-gray-150">
        <CardContent className="pt-6 space-y-6">
          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Asset</label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="w-full h-11 border-gray-250">
                <SelectValue placeholder="Select an asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.tag} - {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAssetId && selectedAssetInfo && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {selectedAssetInfo.status === 'allocated' ? (
                // ALLOCATED STATE - Show Transfer Request Form
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
                    <p className="font-semibold">Already Allocated to {currentHolder?.employee_name || "Unknown"} ({currentHolder?.department_name || "Unknown"})</p>
                    <p className="mt-1 opacity-90">{canAllocate ? "You can transfer this asset to a new employee below" : "Direct re-allocation is blocked - submit a transfer request below"}</p>
                  </div>

                  <form onSubmit={handleTransferRequest} className="space-y-5">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">{canAllocate ? "Direct Transfer" : "Transfer Request"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-500 uppercase">From</label>
                          <div className="h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm flex items-center text-gray-500 font-medium">
                            {currentHolder?.employee_name || "Unknown"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-500 uppercase">To</label>
                          <Select value={toEmployeeId} onValueChange={setToEmployeeId}>
                            <SelectTrigger className="h-11 border-gray-250">
                              <SelectValue placeholder="Select Employee...." />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Reason</label>
                      <Textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px] resize-none border-gray-250 rounded-xl"
                        placeholder="Provide a reason for the transfer..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !toEmployeeId}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 px-8"
                    >
                      {isSubmitting ? "Requesting..." : "Request Transfer"}
                    </Button>
                  </form>
                </div>
              ) : selectedAssetInfo.status === 'available' ? (
                // AVAILABLE STATE - Show Allocation Form
                <div className="space-y-6">
                  <form onSubmit={handleAllocate} className="space-y-5">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Allocate Asset</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-500 uppercase">Allocate To</label>
                          <Select value={toEmployeeId} onValueChange={setToEmployeeId}>
                            <SelectTrigger className="h-11 border-gray-250">
                              <SelectValue placeholder="Select Employee...." />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Notes (Optional)</label>
                      <Textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px] resize-none border-gray-250 rounded-xl"
                        placeholder="Provide any allocation notes..."
                      />
                    </div>

                    {canAllocate ? (
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !toEmployeeId}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 px-8"
                      >
                        {isSubmitting ? "Allocating..." : "Allocate Asset"}
                      </Button>
                    ) : (
                      <p className="text-sm text-red-500">You do not have permission to allocate assets directly.</p>
                    )}
                  </form>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
                  <p className="font-semibold">Asset is in {selectedAssetInfo.status}</p>
                  <p className="mt-1 opacity-90">You cannot allocate or transfer this asset right now.</p>
                </div>
              )}

              {/* Allocation History */}
              <div className="pt-8 mt-8 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Allocation history</h3>
                {isLoadingHistory ? (
                  <p className="text-sm text-muted-foreground">Loading history...</p>
                ) : assetHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history available for this asset.</p>
                ) : (
                  <div className="space-y-2">
                    {assetHistory.map((history) => (
                      <div key={history.id} className="text-sm text-gray-700 flex flex-col gap-1">
                        <div>
                          <span className="font-medium text-gray-900">
                            {new Date(history.allocated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                          </span>
                          {" - Allocated to "}
                          <span className="font-medium">{history.employee_name}</span>
                          {history.department_name && ` - ${history.department_name}`}
                        </div>
                        {history.returned_at && (
                          <div className="text-gray-500 pl-4 border-l-2 border-gray-100 ml-1">
                            Returned on {new Date(history.returned_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                            {history.notes && ` - notes: ${history.notes}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Allocations Table */}
      <div className="pt-8">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4">Active Allocations Overview</h2>
        <Card className="shadow-sm border-gray-150">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="px-6 py-4">Asset</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Allocated Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right px-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAllocations ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Loading allocations...
                    </TableCell>
                  </TableRow>
                ) : activeAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No active allocations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeAllocations.map((allocation) => (
                    <TableRow key={allocation.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          {allocation.asset_tag}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{allocation.asset_name}</div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{allocation.employee_name}</TableCell>
                      <TableCell className="text-gray-600">{new Date(allocation.allocated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{allocation.notes || "-"}</TableCell>
                      <TableCell className="text-right px-6 py-4">
                        {(canAllocate || allocation.employee_id === user?.id) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReturnAsset(allocation.id, selectedAssetId === allocation.asset_id ? selectedAssetId : undefined)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 rounded-lg"
                          >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Return
                          </Button>
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
    </div>
  );
}
