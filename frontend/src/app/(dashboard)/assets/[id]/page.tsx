"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type AssetDetail = {
  id: string;
  name: string;
  tag: string;
  category_name: string | null;
  department_name: string | null;
  status: string;
  serial_number: string;
  purchase_date: string | null;
  cost: number | null;
  created_at: string;
  allocations: any[];
  maintenance: any[];
  transfers: any[];
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id as string);
    }
  }, [params.id]);

  const fetchAsset = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast({ title: "Asset not found", variant: "destructive" });
          router.push("/assets");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setAsset(data);
    } catch (error) {
      toast({ title: "Error fetching asset details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading asset details...</div>;
  }

  if (!asset) {
    return null;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/assets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Tag className="h-4 w-4" /> {asset.tag}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full border bg-muted font-medium capitalize">
          {asset.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Asset Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p>{asset.category_name || "Uncategorized"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p>{asset.department_name || "No Department Assigned"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
              <p className="font-mono">{asset.serial_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
              <p>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cost</p>
              <p>{asset.cost ? `$${Number(asset.cost).toFixed(2)}` : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Added On</p>
              <p>{new Date(asset.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <Tabs defaultValue="allocations" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="allocations">Allocations</TabsTrigger>
                <TabsTrigger value="transfers">Transfers</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="allocations" className="mt-4">
                <h3 className="font-semibold text-lg mb-2">Allocation History</h3>
                {asset.allocations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No allocations recorded for this asset.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Allocated At</TableHead>
                        <TableHead>Returned At</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.allocations.map((al: any) => (
                        <TableRow key={al.id}>
                          <TableCell className="font-medium">{al.employee_name}</TableCell>
                          <TableCell>{new Date(al.allocated_at).toLocaleDateString()}</TableCell>
                          <TableCell>{al.returned_at ? new Date(al.returned_at).toLocaleDateString() : <span className="text-green-600 font-medium">Currently Held</span>}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{al.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              <TabsContent value="transfers" className="mt-4">
                <h3 className="font-semibold text-lg mb-2">Transfer History</h3>
                {asset.transfers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No transfers recorded for this asset.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.transfers.map((tr: any) => (
                        <TableRow key={tr.id}>
                          <TableCell>{tr.from_employee_name}</TableCell>
                          <TableCell>{tr.to_employee_name}</TableCell>
                          <TableCell>
                            <span className="capitalize">{tr.status}</span>
                          </TableCell>
                          <TableCell>{new Date(tr.transferred_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="maintenance" className="mt-4">
                <h3 className="font-semibold text-lg mb-2">Maintenance Logs</h3>
                {asset.maintenance.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No maintenance recorded for this asset.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.maintenance.map((mn: any) => (
                        <TableRow key={mn.id}>
                          <TableCell className="capitalize">{mn.type}</TableCell>
                          <TableCell className="capitalize">{mn.status}</TableCell>
                          <TableCell>{mn.cost ? `$${mn.cost}` : "-"}</TableCell>
                          <TableCell>{new Date(mn.scheduled_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
