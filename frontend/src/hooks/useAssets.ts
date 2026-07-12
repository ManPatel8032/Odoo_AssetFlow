import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAssets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAssets() {
      const { data, error } = await supabase.from("assets").select("*");
      if (!error && data) {
        setAssets(data);
      }
      setLoading(false);
    }
    fetchAssets();
  }, []);

  return { assets, loading };
}
