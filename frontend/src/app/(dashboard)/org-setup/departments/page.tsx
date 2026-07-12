"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Department = {
  id: string;
  name: string;
  head_id: string | null;
  head_name: string | null;
  parent_id: string | null;
  parent_name: string | null;
  status: "active" | "inactive";
};

type Employee = {
  id: string;
  full_name: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Form State
  const [deptName, setDeptName] = useState("");
  const [headId, setHeadId] = useState("none");
  const [parentId, setParentId] = useState("none");
  const [deptStatus, setDeptStatus] = useState<"active" | "inactive">("active");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/departments`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/employees`)
      ]);
      
      if (deptRes.ok && empRes.ok) {
        const deptData = await deptRes.json();
        const empData = await empRes.json();
        setDepartments(deptData);
        setEmployees(empData);
      } else {
        toast({ title: "Failed to load data", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptName(dept.name);
      setHeadId(dept.head_id || "none");
      setParentId(dept.parent_id || "none");
      setDeptStatus(dept.status);
    } else {
      setEditingDept(null);
      setDeptName("");
      setHeadId("none");
      setParentId("none");
      setDeptStatus("active");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;

    try {
      const payload = {
        name: deptName,
        head_id: headId === "none" ? null : headId,
        parent_id: parentId === "none" ? null : parentId,
        status: deptStatus
      };

      let res;
      if (editingDept) {
        res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/departments/${editingDept.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({ title: editingDept ? "Department updated successfully" : "Department added successfully" });
        setIsDialogOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        toast({ title: errorData.error || "Failed to save department", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving department:", error);
      toast({ title: "Failed to save department", variant: "destructive" });
    }
  };

  const tabs = [
    { href: "/org-setup/departments", label: "Departments" },
    { href: "/org-setup/categories", label: "Categories" },
    { href: "/org-setup/employees", label: "Employee" }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Organization Setup</h1>
        <p className="text-muted-foreground mt-1">Configure company structure, inventory classifications, and personnel roles.</p>
      </div>

      {/* Tab Navigation and Add Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href}>
                <span className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer block ${
                  active ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-900"
                }`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="h-10 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Department Name</label>
                <Input 
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Engineering"
                  required
                  className="rounded-lg border-gray-250 h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Department Head</label>
                <Select value={headId} onValueChange={setHeadId}>
                  <SelectTrigger className="rounded-lg h-10 border-gray-250">
                    <SelectValue placeholder="Select a head (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Parent Department</label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="rounded-lg h-10 border-gray-250">
                    <SelectValue placeholder="Select parent department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments
                      .filter(d => !editingDept || d.id !== editingDept.id)
                      .map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {editingDept && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <Select value={deptStatus} onValueChange={(v: "active" | "inactive") => setDeptStatus(v)}>
                    <SelectTrigger className="rounded-lg h-10 border-gray-250">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg">Cancel</Button>
                <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-gray-150 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/70 border-b border-gray-100">
              <TableRow>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Department</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Head</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Parent Dept</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6">Status</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10 px-6">
                    Loading departments...
                  </TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 px-6">
                    No departments found.
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id} className="hover:bg-gray-50/40 border-b border-gray-100 last:border-0">
                    <TableCell className="font-medium text-gray-950 px-6 py-4">{dept.name}</TableCell>
                    <TableCell className="px-6 py-4">
                      {dept.head_name ? (
                        <span className="text-gray-900">{dept.head_name}</span>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {dept.parent_name ? (
                        <span className="text-gray-700">{dept.parent_name}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">--</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        dept.status === "active" 
                          ? "bg-green-50 text-green-700 ring-green-600/20" 
                          : "bg-gray-50 text-gray-600 ring-gray-500/20"
                      }`}>
                        {dept.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(dept)} className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground italic mt-2">
        * Editing a department here also drives the picklists in asset registration, transfers, and employee directory management.
      </p>
    </div>
  );
}
