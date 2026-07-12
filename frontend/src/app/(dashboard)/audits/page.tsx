"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

export default function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAuditName, setNewAuditName] = useState("");

  const fetchAudits = async () => {
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
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuditName) return;
    
    try {
      // Mocking passing all asset IDs to audit
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/audits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newAuditName,
          asset_ids: ["asset-1", "asset-2", "asset-3"] 
        })
      });
      if (response.ok) {
        setNewAuditName("");
        setIsCreating(false);
        fetchAudits();
      }
    } catch (error) {
      console.error('Failed to create audit', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Cycles</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Audit Cycle
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Create New Audit</h2>
          <form onSubmit={handleCreateAudit} className="flex gap-3">
            <input 
              type="text" 
              placeholder="e.g., Q4 Hardware Audit" 
              className="border p-2 rounded flex-1"
              value={newAuditName}
              onChange={e => setNewAuditName(e.target.value)}
              required
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Start Audit</button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : audits.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg border border-dashed text-center">
          No audit cycles found.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audit Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{audit.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      audit.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(audit.start_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {audit.itemCount} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      href={`/audits/${audit.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {audit.status === 'active' ? 'Execute Audit' : 'View Results'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { fetchWithAuth } from "@/lib/api";
