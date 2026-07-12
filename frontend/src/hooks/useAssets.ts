import { useState, useEffect } from "react";

export function useAssets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
        }
      } catch (error) {
        console.error('Failed to fetch assets', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  return { assets, loading };
}
