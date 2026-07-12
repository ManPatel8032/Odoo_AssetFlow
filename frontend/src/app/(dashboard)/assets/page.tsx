"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Asset = {
  id: string;
  name: string;
  tag: string;
  category_name: string | null;
  status: string;
  serial_number: string;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAssets(data);
    } catch (error) {
      toast({ title: "Error fetching assets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return "bg-green-50 text-green-700 ring-green-600/20";
      case 'allocated': return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case 'maintenance': return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
      case 'retired': return "bg-gray-50 text-gray-700 ring-gray-600/20";
      default: return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        <Link href="/assets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Serial No.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No assets found.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium text-blue-600">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {asset.tag}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{asset.name}</TableCell>
                    <TableCell>{asset.category_name || "Uncategorized"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(asset.status)}`}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{asset.serial_number}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/assets/${asset.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </Link>
                      <Link href={`/assets/${asset.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                      </Link>
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

import { fetchWithAuth } from "@/lib/api";
