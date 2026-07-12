import { useState, useEffect } from "react";

export function useMaintenance() {
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaintenance() {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance`);
        if (response.ok) {
          const data = await response.json();
          setMaintenance(data);
        }
      } catch (error) {
        console.error('Failed to fetch maintenance', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMaintenance();
  }, []);

  return { maintenance, loading };
}

import { fetchWithAuth } from "@/lib/api";
