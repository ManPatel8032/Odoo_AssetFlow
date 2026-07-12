import { useState, useEffect } from "react";

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    }

    // 1. Fetch initial notifications
    fetchNotifications();

    // 2. Poll for updates every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { notifications };
}
