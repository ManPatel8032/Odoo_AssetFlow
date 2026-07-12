"use client";

import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRight, X } from "lucide-react";

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
    <Card className="shadow-sm hover:shadow-md transition-all border-border/60">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start mb-1">
          <Badge variant="outline" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 font-semibold border-blue-200">
            {ticket.asset_tag}
          </Badge>
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
            {format(new Date(ticket.created_at), 'MMM dd')}
          </span>
        </div>
        <h3 className="font-semibold leading-tight text-foreground">{ticket.asset_name}</h3>
      </CardHeader>
      
      <CardContent className="p-4 py-2">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-3">{ticket.description}</p>
        
        <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted/50 p-2 rounded-md w-fit gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5" />
          {format(new Date(ticket.scheduled_date), 'MMM dd, yyyy')}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-3 border-t bg-muted/10 flex justify-between gap-2">
        {ticket.status !== 'cancelled' && ticket.status !== 'completed' ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onStatusChange(ticket.id, 'cancelled')}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
            title="Cancel Ticket"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        ) : (
          <div /> // Spacer
        )}
        
        {nextStatus && (
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => onStatusChange(ticket.id, nextStatus)}
            className="h-8 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          >
            {nextStatus === 'in_progress' ? 'Start Work' : 'Complete'}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
