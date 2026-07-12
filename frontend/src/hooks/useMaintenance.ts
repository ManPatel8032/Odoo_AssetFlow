import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useMaintenance() {
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMaintenance() {
      const { data, error } = await supabase.from("maintenance").select("*");
      if (!error && data) {
        setMaintenance(data);
      }
      setLoading(false);
    }
    fetchMaintenance();
  }, []);

  return { maintenance, loading };
}
