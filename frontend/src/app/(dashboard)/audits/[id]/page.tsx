"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function AuditExecutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [cycle, setCycle] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (!hasPermission(user.role, "audit_view")) {
        router.replace("/dashboard");
      }
    }
  }, [user, authLoading, router]);

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

  const fetchCycle = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/audits`);
      if (response.ok) {
        const audits = await response.json();
        const currentCycle = audits.find((a: any) => a.id === id);
        if (currentCycle) {
          setCycle(currentCycle);
        }
      }
    } catch (error) {
      console.error('Failed to fetch audits for cycle info', error);
    }
  };

  useEffect(() => {
    if (id && user && hasPermission(user.role, "audit_view")) {
      fetchItems();
      fetchCycle();
    }
  }, [id, user]);

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
        router.refresh();
      } else {
        console.error('Failed to close audit: API returned', response.status);
        setIsClosing(false);
        alert('Failed to close audit cycle.');
      }
    } catch (error) {
      console.error('Failed to close audit', error);
      setIsClosing(false);
      alert('An error occurred while closing the audit.');
    }
  };

  if (authLoading || !user || !hasPermission(user.role, "audit_view")) {
    return <div className="p-6">Loading...</div>;
  }

  const canManage = hasPermission(user.role, "audit_manage");
  const isAuditComplete = items.length > 0 && items.every(item => item.status !== 'pending');
  const flaggedCount = items.filter(item => item.status === 'missing' || item.status === 'damaged').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <button onClick={() => router.push("/audits")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Audits
        </button>
      </div>

      <div className="bg-[#2a2a2a] text-white p-6 rounded-xl shadow border border-gray-600 mb-6">
        <h2 className="text-xl font-medium mb-1">
          {cycle ? cycle.name : "Loading Audit..."} {cycle?.start_date ? `- Started on ${new Date(cycle.start_date).toLocaleDateString()}` : ''}
        </h2>
        <p className="text-gray-300 text-sm">
          Auditors: Current User
        </p>
      </div>

      {!isAuditComplete && items.length > 0 && canManage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-700">
          You must mark all items before you can close and reconcile this audit cycle.
        </div>
      )}

      {loading ? (
        <p>Loading checklist...</p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Asset</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Expected location</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.asset_tag} {item.asset_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{item.location || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center space-x-3">
                      <button 
                        onClick={() => handleMarkStatus(item.id, 'verified')}
                        disabled={!canManage}
                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          item.status === 'verified' 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : 'bg-white border-gray-300 text-gray-500 hover:border-green-300'
                        } ${!canManage ? 'opacity-50 cursor-not-allowed hover:border-gray-300' : ''}`}
                      >
                        Verified
                      </button>
                      <button 
                        onClick={() => handleMarkStatus(item.id, 'missing')}
                        disabled={!canManage}
                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          item.status === 'missing' 
                            ? 'bg-red-50 border-red-500 text-red-700' 
                            : 'bg-white border-gray-300 text-gray-500 hover:border-red-300'
                        } ${!canManage ? 'opacity-50 cursor-not-allowed hover:border-gray-300' : ''}`}
                      >
                        Missing
                      </button>
                      <button 
                        onClick={() => handleMarkStatus(item.id, 'damaged')}
                        disabled={!canManage}
                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          item.status === 'damaged' 
                            ? 'bg-gray-100 border-gray-500 text-gray-700' 
                            : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                        } ${!canManage ? 'opacity-50 cursor-not-allowed hover:border-gray-300' : ''}`}
                      >
                        Damaged
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-[#2a2a2a] border border-[#d97706] text-[#fbbf24] px-6 py-4 rounded-lg mb-6">
          <p className="font-medium">
            {flaggedCount} assets flagged - discrepancy report generated automatically
          </p>
        </div>
      )}

      {canManage && (
        <button 
          onClick={handleCloseAudit}
          disabled={!isAuditComplete || isClosing}
          className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
            !isAuditComplete || isClosing ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-transparent border border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600'
          }`}
        >
          {isClosing ? "Closing..." : "Close audit cycle"}
        </button>
      )}

    </div>
  );
}
