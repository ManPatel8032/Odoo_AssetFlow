import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAudits() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAudits() {
      const { data, error } = await supabase.from("audit_cycles").select("*");
      if (!error && data) {
        setAudits(data);
      }
      setLoading(false);
    }
    fetchAudits();
  }, []);

  return { audits, loading };
}
