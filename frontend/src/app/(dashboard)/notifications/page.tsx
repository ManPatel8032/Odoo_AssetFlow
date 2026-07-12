"use client";

import { Bell, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Notification = {
  id: string;
  title: string;
  description: string;
  type: "info" | "warning" | "success";
  time: string;
  read: boolean;
};

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Maintenance Request Approved",
    description: "Your request for LAP-0012 has been approved and assigned to a technician.",
    type: "success",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    title: "Overdue Asset Return",
    description: "Please return VEH-0004. It is currently 1 day overdue.",
    type: "warning",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    title: "System Update",
    description: "The AssetFlow platform will undergo scheduled maintenance at 2 AM EST.",
    type: "info",
    time: "1 day ago",
    read: true,
  },
  {
    id: "4",
    title: "Transfer Request Received",
    description: "Sarah Smith has requested the transfer of LAP-0019 to her allocation.",
    type: "info",
    time: "2 days ago",
    read: true,
  },
];

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Bell className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex items-start p-4 rounded-lg border ${notification.read ? 'bg-white' : 'bg-blue-50/50 border-blue-100'}`}
              >
                <div className="mt-0.5 mr-4 flex-shrink-0">
                  {notification.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm font-medium leading-none ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
                    {notification.title}
                  </p>
                  <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-blue-700/80'}`}>
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground pt-1">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
