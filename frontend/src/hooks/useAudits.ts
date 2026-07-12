import { useState, useEffect } from "react";

export function useAudits() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudits() {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/audits`);
        if (response.ok) {
          const data = await response.json();
          setAudits(data);
        }
      } catch (error) {
        console.error('Failed to fetch audits', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAudits();
  }, []);

  return { audits, loading };
}

import { fetchWithAuth } from "@/lib/api";
