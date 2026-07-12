"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle2, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

// Helper for formatting relative time
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHrs = Math.floor(diffInMins / 6000);
  
  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHrs < 24) return `${diffInHrs}h ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications/${id}/read`, {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        // Dispatch a custom event so Navbar count updates immediately
        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications/read-all`, {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast({ title: "All notifications marked as read." });
        // Dispatch a custom event so Navbar count updates immediately
        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("approved") || lowerTitle.includes("confirmed") || lowerTitle.includes("success")) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (lowerTitle.includes("reject") || lowerTitle.includes("warn") || lowerTitle.includes("overdue") || lowerTitle.includes("cancel")) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your asset transfers, bookings, and allocations.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Eye className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Bell className="mr-2 h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center space-y-2">
              <Bell className="h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">You're all caught up!</p>
              <p className="text-sm">No new notifications at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start p-4 rounded-lg border transition-all duration-200 ${
                    notification.read ? 'bg-white' : 'bg-blue-50/40 border-blue-100 shadow-sm'
                  }`}
                >
                  <div className="mt-0.5 mr-4 flex-shrink-0">
                    {getNotificationIcon(notification.title)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-semibold leading-none ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
                      {notification.title}
                    </p>
                    <p className={`text-sm mt-1 leading-relaxed ${notification.read ? 'text-muted-foreground' : 'text-blue-800/80'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground pt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg h-8 px-2.5"
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
