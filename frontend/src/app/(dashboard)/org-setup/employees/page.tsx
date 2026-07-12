"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  department: string | null;
  status: "active" | "inactive";
};

// Mock data for initial UI build
const initialEmployees: Employee[] = [
  { id: "u1", name: "Alice Smith", email: "alice@example.com", role: "admin", department: "Engineering", status: "active" },
  { id: "u2", name: "Bob Jones", email: "bob@example.com", role: "manager", department: "Human Resources", status: "active" },
  { id: "u3", name: "Charlie Brown", email: "charlie@example.com", role: "employee", department: "Engineering", status: "active" },
  { id: "u4", name: "Diana Prince", email: "diana@example.com", role: "employee", department: null, status: "inactive" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promotingEmployee, setPromotingEmployee] = useState<Employee | null>(null);
  
  // Form State
  const [newRole, setNewRole] = useState<"admin" | "manager" | "employee">("employee");
  const { toast } = useToast();

  const handleOpenPromoteDialog = (emp: Employee) => {
    setPromotingEmployee(emp);
    setNewRole(emp.role);
    setIsDialogOpen(true);
  };

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (promotingEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === promotingEmployee.id ? { ...emp, role: newRole } : emp
      ));
      toast({ title: "Role updated successfully", description: `${promotingEmployee.name} is now a ${newRole}.` });
    }
    setIsDialogOpen(false);
  };

  const toggleStatus = (id: string, currentStatus: "active" | "inactive") => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, status: newStatus } : emp
    ));
    toast({ title: `Employee marked as ${newStatus}` });
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
              <div className="p-2 border rounded bg-gray-50">{promotingEmployee?.name} ({promotingEmployee?.email})</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Role</label>
              <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee (Basic Access)</SelectItem>
                  <SelectItem value="manager">Manager (Asset & Booking Approvals)</SelectItem>
                  <SelectItem value="admin">Admin (Full System Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell>{emp.department || "Unassigned"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        emp.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10' :
                        emp.role === 'manager' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10' :
                        'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}>
                        {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
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
                        onClick={() => toggleStatus(emp.id, emp.status)}
                      >
                        {emp.status === 'active' ? 'Deactivate' : 'Activate'}
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
