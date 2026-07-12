"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Category = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [departmentId, setDepartmentId] = useState("none");
  const [serialNumber, setSerialNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState("available");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, deptRes] = await Promise.all([
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/categories`),
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/departments`)
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (deptRes.ok) setDepartments(await deptRes.json());
      } catch (err) {
        console.error("Failed to fetch categories or departments", err);
      }
    };
    fetchData();

    if (params.id) {
      fetchAsset(params.id as string);
    }
  }, [params.id]);

  const fetchAsset = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets/${id}`);
      if (!res.ok) throw new Error("Failed to fetch asset");
      
      const data = await res.json();
      setName(data.name || "");
      setCategoryId(data.category_id || "none");
      setDepartmentId(data.department_id || "none");
      setSerialNumber(data.serial_number || "");
      if (data.purchase_date) {
        setPurchaseDate(new Date(data.purchase_date).toISOString().split('T')[0]);
      }
      setCost(data.cost ? String(data.cost) : "");
      setStatus(data.status || "available");
    } catch (error) {
      toast({ title: "Error fetching asset details", variant: "destructive" });
      router.push("/assets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !serialNumber) {
      toast({ title: "Name and Serial Number are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category_id: categoryId === "none" ? null : categoryId,
          department_id: departmentId === "none" ? null : departmentId,
          serial_number: serialNumber,
          purchase_date: purchaseDate || null,
          cost: cost ? parseFloat(cost) : null,
          status
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update asset");
      }

      toast({ title: "Asset updated successfully" });
      router.push("/assets");
    } catch (error: any) {
      toast({ title: error.message || "Failed to update asset", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-[50vh] text-muted-foreground">Loading asset details...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/assets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Update Details</CardTitle>
            <CardDescription>Modify the information for this asset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Name <span className="text-red-500">*</span></label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MacBook Pro 16"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Serial Number <span className="text-red-500">*</span></label>
                <Input 
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. C02X54321..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Date</label>
                <Input 
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost ($)</label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t pt-4">
            <Link href="/assets">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Asset"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

