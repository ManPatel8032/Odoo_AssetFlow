"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Eye, Tag, Search, AlertTriangle, Layers, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

type Asset = {
  id: string;
  name: string;
  tag: string;
  category_name: string | null;
  department_name: string | null;
  status: string;
  serial_number: string;
  location: string;
};

type Category = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");

  const { toast } = useToast();
  
  const canCreate = user?.role ? hasPermission(user.role, "assets_create") : false;
  const canEdit = user?.role ? hasPermission(user.role, "assets_edit") : false;

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [search, selectedCategory, selectedStatus, selectedDept]);

  const fetchFilterOptions = async () => {
    try {
      const [catRes, deptRes] = await Promise.all([
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/categories`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/departments`)
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "all") params.append("category_id", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedDept !== "all") params.append("department_id", selectedDept);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets?${params.toString()}`
      );
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
    switch (status.toLowerCase()) {
      case 'available': return "bg-green-50 text-green-700 ring-green-600/20";
      case 'allocated': return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case 'maintenance': return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case 'retired': return "bg-red-50 text-red-700 ring-red-600/20";
      default: return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Assets</h1>
          <p className="text-muted-foreground mt-1">Register, browse, and track all physical assets and resources.</p>
        </div>
        {canCreate && (
          <Link href="/assets/new">
            <Button className="h-10 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Register Asset
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters Layout */}
      <div className="grid gap-4 md:grid-cols-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, serial, or name..."
            className="pl-9 h-10 rounded-xl border-gray-250"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="rounded-xl h-10 border-gray-250">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-400" />
              <SelectValue placeholder="Category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="rounded-xl h-10 border-gray-250">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="allocated">Allocated</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="rounded-xl h-10 border-gray-250 md:col-span-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <SelectValue placeholder="Department" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Asset Table */}
      <Card className="shadow-sm border-gray-150 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/70 border-b border-gray-100">
              <TableRow>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Tag</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Name</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Category</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Department</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Status</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Location</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10 px-6">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12 px-6">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <AlertTriangle className="h-8 w-8 text-gray-300" />
                      <p className="font-medium">No assets found</p>
                      <p className="text-xs text-gray-400">Try adjusting your filters or search terms.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-gray-50/40 border-b border-gray-100 last:border-0">
                    <TableCell className="font-medium text-blue-600 px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                        {asset.tag}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 px-6 py-4">{asset.name}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{asset.category_name || "Uncategorized"}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{asset.department_name || "—"}</TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusColor(asset.status)}`}>
                        {asset.status.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 font-medium">
                      {asset.location}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-2">
                      <Link href={`/assets/${asset.id}`} title="View Details">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {canEdit && (
                        <Link href={`/assets/${asset.id}/edit`} title="Edit Asset">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 rounded-lg">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
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
