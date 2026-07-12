"use client";

import { useState, useEffect } from "react";
import MaintenanceTicketCard from "../../../components/maintenance/MaintenanceTicketCard";
import MaintenanceForm from "../../../components/maintenance/MaintenanceForm";

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance`);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance/${id}/status`, {
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
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Maintenance Workflows</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Raise Request
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className="min-w-[300px] flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col">
              <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200 flex justify-between">
                {col.title}
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tickets.filter(t => t.status === col.id).length}
                </span>
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3">
                {tickets.filter(t => t.status === col.id).map(ticket => (
                  <MaintenanceTicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onStatusChange={handleStatusChange} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <MaintenanceForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            setIsFormOpen(false);
            fetchTickets();
          }} 
        />
      )}
    </div>
  );
}
