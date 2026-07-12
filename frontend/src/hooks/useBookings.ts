import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBookings() {
      const { data, error } = await supabase.from("bookings").select("*");
      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    }
    fetchBookings();
  }, []);

  return { bookings, loading };
}
