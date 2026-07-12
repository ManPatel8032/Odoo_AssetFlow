import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch initial notifications
    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    }
    fetchNotifications();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { notifications };
}
