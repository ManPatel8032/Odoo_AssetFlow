"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AuditExecutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/audits/${id}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItems();
  }, [id]);

  const handleMarkStatus = async (itemId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/audits/${id}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        // Update local state to reflect change immediately
        setItems(items.map(item => item.id === itemId ? { ...item, status } : item));
      }
    } catch (error) {
      console.error('Failed to update item status', error);
    }
  };

  const handleCloseAudit = async () => {
    if (!confirm("Are you sure you want to close this audit? This will auto-reconcile statuses (Missing -> Lost, Damaged -> Maintenance).")) return;
    
    setIsClosing(true);
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/audits/${id}/close`, {
        method: "POST"
      });
      if (response.ok) {
        router.push("/audits");
      }
    } catch (error) {
      console.error('Failed to close audit', error);
      setIsClosing(false);
    }
  };

  const isAuditComplete = items.every(item => item.status !== 'pending');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <div>
          <button onClick={() => router.push("/audits")} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
            ← Back to Audits
          </button>
          <h1 className="text-2xl font-bold">Audit Execution Panel</h1>
          <p className="text-gray-500 text-sm">Review each item and mark its condition.</p>
        </div>
        <button 
          onClick={handleCloseAudit}
          disabled={!isAuditComplete || isClosing}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            !isAuditComplete || isClosing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isClosing ? "Closing..." : "Close & Reconcile Audit"}
        </button>
      </div>

      {!isAuditComplete && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-700">
          You must mark all items before you can close and reconcile this audit cycle.
        </div>
      )}

      {loading ? (
        <p>Loading checklist...</p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">
                    {item.asset_tag}
                  </span>
                  <span className="text-xs text-gray-500">
                    Location: {item.location}
                  </span>
                </div>
                <h3 className="font-medium text-lg">{item.asset_name}</h3>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleMarkStatus(item.id, 'verified')}
                  className={`px-4 py-2 rounded border text-sm font-medium flex items-center transition-colors ${
                    item.status === 'verified' 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ✅ Verified
                </button>
                <button 
                  onClick={() => handleMarkStatus(item.id, 'missing')}
                  className={`px-4 py-2 rounded border text-sm font-medium flex items-center transition-colors ${
                    item.status === 'missing' 
                      ? 'bg-red-100 border-red-500 text-red-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ❌ Missing
                </button>
                <button 
                  onClick={() => handleMarkStatus(item.id, 'damaged')}
                  className={`px-4 py-2 rounded border text-sm font-medium flex items-center transition-colors ${
                    item.status === 'damaged' 
                      ? 'bg-orange-100 border-orange-500 text-orange-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ⚠️ Damaged
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
