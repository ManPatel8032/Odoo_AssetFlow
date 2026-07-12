"use client";

import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";

type Employee = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "asset_manager" | "department_head" | "employee";
  department_name: string | null;
  status: "active" | "inactive";
};

type Department = {
  id: string;
  name: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promotingEmployee, setPromotingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newRole, setNewRole] = useState<"admin" | "asset_manager" | "department_head" | "employee">("employee");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("none");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/profiles`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/departments`)
      ]);
      
      if (empRes.ok && deptRes.ok) {
        setEmployees(await empRes.json());
        setDepartments(await deptRes.json());
      } else {
        toast({ title: "Failed to fetch data", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPromoteDialog = (emp: Employee) => {
    setPromotingEmployee(emp);
    setNewRole(emp.role);
    setSelectedDeptId("none");
    setIsDialogOpen(true);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (promotingEmployee) {
      if (newRole === 'department_head' && selectedDeptId === 'none') {
        toast({ title: "Please select a department", variant: "destructive" });
        return;
      }
      
      try {
        const payload: any = { role: newRole };
        if (newRole === 'department_head') {
          payload.department_id = selectedDeptId;
        }
        
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/profiles/${promotingEmployee.id}/promote`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          toast({ title: "Role updated successfully", description: `${promotingEmployee.full_name} is now a ${newRole.replace(/_/g, ' ')}.` });
          setIsDialogOpen(false);
          fetchData(); // Refresh data to get updated roles and department assignments
        } else {
          const errorData = await res.json();
          toast({ title: errorData.error || "Failed to update role", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error promoting employee:", error);
        toast({ title: "Failed to update role", variant: "destructive" });
      }
    }
  };

  const deactivateEmployee = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/profiles/${id}/deactivate`, {
        method: "PUT",
      });
      
      if (res.ok) {
        toast({ title: "Employee deactivated successfully" });
        fetchData();
      } else {
        const errorData = await res.json();
        toast({ title: errorData.error || "Failed to deactivate employee", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deactivating employee:", error);
      toast({ title: "Failed to deactivate employee", variant: "destructive" });
    }
  };

  const getAllowedRoles = (currentRole: string) => {
    const roles = [
      { value: 'employee', label: 'Employee (Basic Access)' },
      { value: 'asset_manager', label: 'Asset Manager' },
      { value: 'department_head', label: 'Department Head' },
      { value: 'admin', label: 'Admin (Full System Access)' }
    ];
    
    // Strict order: employee -> asset_manager -> department_head -> admin
    if (currentRole === 'employee') {
      return roles.filter(r => r.value === 'employee' || r.value === 'asset_manager');
    } else if (currentRole === 'asset_manager') {
      return roles.filter(r => r.value === 'employee' || r.value === 'asset_manager' || r.value === 'department_head');
    } else if (currentRole === 'department_head') {
      return roles.filter(r => r.value === 'asset_manager' || r.value === 'department_head' || r.value === 'admin');
    } else if (currentRole === 'admin') {
      return roles.filter(r => r.value === 'department_head' || r.value === 'admin');
    }
    
    return roles;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employees & Promotions</h1>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Employee Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePromote} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <div className="p-2 border rounded bg-gray-50">{promotingEmployee?.full_name} ({promotingEmployee?.email})</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Role</label>
              <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {promotingEmployee && getAllowedRoles(promotingEmployee.role).map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newRole === 'department_head' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Department</label>
                <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select a department...</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update Role</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="font-medium">{emp.full_name}</div>
                      <div className="text-xs text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell>{emp.department_name || "Unassigned"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        emp.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10' :
                        emp.role === 'asset_manager' || emp.role === 'department_head' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10' :
                        'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}>
                        {emp.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        emp.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                      }`}>
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenPromoteDialog(emp)}>
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        Promote
                      </Button>
                      <Button 
                        variant={emp.status === 'active' ? 'ghost' : 'default'} 
                        size="sm" 
                        onClick={() => deactivateEmployee(emp.id)}
                        disabled={emp.status === 'inactive'}
                      >
                        Deactivate
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
