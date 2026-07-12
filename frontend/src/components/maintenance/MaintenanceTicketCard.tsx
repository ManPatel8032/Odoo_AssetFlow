"use client";

import { format } from "date-fns";

export default function MaintenanceTicketCard({ ticket, onStatusChange }: { ticket: any, onStatusChange: (id: string, status: string) => void }) {
  
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scheduled': return 'in_progress';
      case 'in_progress': return 'completed';
      default: return null;
    }
  };

  const nextStatus = getNextStatus(ticket.status);

  return (
    <div className="bg-white p-4 rounded shadow-sm border border-gray-200 text-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
          {ticket.asset_tag}
        </span>
        <span className="text-gray-400 text-xs">
          {format(new Date(ticket.created_at), 'MMM dd')}
        </span>
      </div>
      
      <h3 className="font-medium text-gray-900 mb-1">{ticket.asset_name}</h3>
      <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
      
      <div className="flex items-center text-xs text-gray-500 mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Sched: {format(new Date(ticket.scheduled_date), 'MMM dd, yyyy')}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        {ticket.status !== 'cancelled' && ticket.status !== 'completed' && (
          <button 
            onClick={() => onStatusChange(ticket.id, 'cancelled')}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            Cancel
          </button>
        )}
        
        {nextStatus && (
          <button 
            onClick={() => onStatusChange(ticket.id, nextStatus)}
            className="ml-auto bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1.5 rounded"
          >
            Move to {nextStatus.replace('_', ' ')}
          </button>
        )}
      </div>
    </div>
  );
}
