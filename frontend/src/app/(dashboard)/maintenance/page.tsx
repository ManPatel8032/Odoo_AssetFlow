"use client";

import { useState, useEffect } from "react";
import MaintenanceTicketCard from "../../../components/maintenance/MaintenanceTicketCard";
import MaintenanceForm from "../../../components/maintenance/MaintenanceForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  
  const canManage = user?.role ? hasPermission(user.role, "maintenance_manage") : false;

  const fetchTickets = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const columns = [
    { id: 'scheduled', title: 'Scheduled' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
    { id: 'cancelled', title: 'Cancelled' }
  ];

  return (
    <div className="p-6 max-w-full mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Workflows</h1>
          <p className="text-muted-foreground mt-1">Track and manage asset repairs, servicing, and general maintenance.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Raise Request
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading maintenance tickets...</div>
      ) : (
        <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
          {columns.map(col => {
            const colTickets = tickets.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="min-w-[320px] max-w-[350px] flex-1 bg-muted/40 rounded-xl border border-border p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <h2 className="font-semibold text-foreground tracking-tight">
                    {col.title}
                  </h2>
                  <Badge variant="secondary" className="rounded-full px-2">
                    {colTickets.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {colTickets.map(ticket => (
                    <MaintenanceTicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      onStatusChange={handleStatusChange} 
                      canManage={canManage}
                    />
                  ))}
                  {colTickets.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-background/50">
                      No tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MaintenanceForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={() => {
          setIsFormOpen(false);
          fetchTickets();
        }} 
      />
    </div>
  );
}
