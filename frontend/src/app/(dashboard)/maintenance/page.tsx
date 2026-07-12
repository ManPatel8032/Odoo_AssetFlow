"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import MaintenanceForm from "../../../components/maintenance/MaintenanceForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Check, ArrowRight, UserCheck, CheckCircle2, AlertCircle, Wrench, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

type Ticket = {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  description: string;
  status: string;
  technician: string | null;
  resolution_notes: string | null;
  scheduled_date: string;
  completed_date: string | null;
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const canManage = user?.role ? hasPermission(user.role, "maintenance_manage") : false;

  // Transition Modal State
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  const { toast } = useToast();

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

  const handleStatusChange = async (id: string, newStatus: string, extraData: any = {}) => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (response.ok) {
        toast({ title: `Ticket status updated to ${newStatus.replace('_', ' ')}` });
        fetchTickets();
      } else {
        const err = await response.json();
        toast({ title: err.error || "Failed to update status", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const openTransitionModal = (ticket: Ticket, nextStatus: string) => {
    setActiveTicket(ticket);
    setTargetStatus(nextStatus);
    setInputValue("");
    setIsTransitionOpen(true);
  };

  const submitTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    const extraData: any = {};
    if (targetStatus === "technician_assigned") {
      extraData.technician = inputValue;
    } else if (targetStatus === "resolved") {
      extraData.resolution_notes = inputValue;
    }

    handleStatusChange(activeTicket.id, targetStatus, extraData);
    setIsTransitionOpen(false);
    setActiveTicket(null);
  };

  const columns = [
    { id: 'pending', title: 'Pending' },
    { id: 'approved', title: 'Approved' },
    { id: 'technician_assigned', title: 'Technician assigned' },
    { id: 'in_progress', title: 'in progress' },
    { id: 'resolved', title: 'Resolved' }
  ];

  return (
    <div className="p-8 max-w-full mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-6 text-gray-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Maintenance Management</h1>
          <p className="text-muted-foreground mt-1">Approving a card moves the asset to under maintenance, resolving returns it to available.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm h-11 px-5"
        >
          <Plus className="mr-2 h-5 w-5" /> Raise Request
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading maintenance tickets...
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-stretch h-full">
          {columns.map(col => {
            const colTickets = tickets.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="min-w-[280px] max-w-[320px] flex-1 bg-gray-50/70 border border-gray-150 rounded-2xl p-4 flex flex-col h-full">
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                    {col.title}
                  </h2>
                  <Badge variant="secondary" className="rounded-full px-2.5 bg-gray-200 text-gray-700 border-0">
                    {colTickets.length}
                  </Badge>
                </div>
                {/* Column Items */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {colTickets.map(ticket => {
                    const isResolved = ticket.status === 'resolved';
                    return (
                      <Card 
                        key={ticket.id} 
                        className={`shadow-sm transition-all border p-4 rounded-xl flex flex-col justify-between gap-3 ${
                          isResolved 
                            ? "bg-green-50/80 border-green-200 text-green-950" 
                            : "bg-white border-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                              isResolved 
                                ? "bg-green-100/70 border-green-300 text-green-800" 
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}>
                              {ticket.asset_tag}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">
                              {new Date(ticket.scheduled_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm tracking-tight pt-1">{ticket.asset_name}</h4>
                          <p className={`text-xs ${isResolved ? 'text-green-800' : 'text-gray-500'} line-clamp-3 leading-relaxed`}>
                            {ticket.description}
                          </p>

                          {/* Extra info for Tech Assigned / In Progress */}
                          {ticket.technician && (
                            <div className={`text-xs font-semibold flex items-center gap-1.5 mt-2 ${isResolved ? 'text-green-850' : 'text-gray-700'}`}>
                              <Wrench className="h-3 w-3" />
                              <span>tech: {ticket.technician}</span>
                            </div>
                          )}

                          {/* Extra info for Resolution notes */}
                          {ticket.resolution_notes && (
                            <div className="text-xs font-semibold flex items-start gap-1.5 mt-2 text-green-800 bg-green-100/50 p-2 rounded-lg">
                              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span>{ticket.resolution_notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Kanban workflow footer action triggers */}
                        {canManage && (
                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100/50">
                            {ticket.status !== 'resolved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(ticket.id, 'cancelled')}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 rounded-lg"
                                title="Cancel Ticket"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            {ticket.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(ticket.id, 'approved')}
                                className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
                              >
                                Approve <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}

                            {ticket.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => openTransitionModal(ticket, 'technician_assigned')}
                                className="h-8 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-3"
                              >
                                Assign Tech <UserCheck className="h-3 w-3 ml-1" />
                              </Button>
                            )}

                            {ticket.status === 'technician_assigned' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-750 text-white rounded-lg px-3"
                              >
                                Start Work <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}

                            {ticket.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => openTransitionModal(ticket, 'resolved')}
                                className="h-8 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg px-3"
                              >
                                Resolve <Check className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                  {colTickets.length === 0 && (
                    <div className="text-center py-10 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl bg-white/40">
                      No tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raised Request Form */}
      <MaintenanceForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={() => {
          setIsFormOpen(false);
          fetchTickets();
        }} 
      />

      {/* Transition Prompt Dialog */}
      <Dialog open={isTransitionOpen} onOpenChange={setIsTransitionOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {targetStatus === "technician_assigned" ? "Assign Technician" : "Resolve Maintenance Ticket"}
            </DialogTitle>
            <DialogDescription>
              {targetStatus === "technician_assigned" 
                ? "Enter the name of the technician assigned to this ticket."
                : "Enter any resolution notes describing what was done to fix the issue."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitTransition} className="space-y-4">
            <div className="space-y-2 pt-2">
              {targetStatus === "technician_assigned" ? (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. R. Varma"
                  required
                  className="rounded-lg h-10 border-gray-250"
                />
              ) : (
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. resolved 7 Jul - replaced broken bulb"
                  required
                  className="rounded-lg border-gray-250 min-h-[80px]"
                />
              )}
            </div>
            <DialogFooter className="pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsTransitionOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg">Confirm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
