"use client";

import { useState, useEffect } from "react";

export default function MaintenanceForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [assetId, setAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    // Mocking assets for dropdown
    setAssets([
      { id: "asset-1", name: "Dell XPS 15", tag: "AF-0001" },
      { id: "asset-2", name: "Conference Room A", tag: "AF-0002" },
      { id: "asset-3", name: "Company Projector", tag: "AF-0003" }
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!assetId || !description || !scheduledDate) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          asset_id: assetId, 
          description, 
          scheduled_date: new Date(scheduledDate).toISOString() 
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create maintenance ticket");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Raise Maintenance Request</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Asset</label>
            <select 
              className="w-full border p-2 rounded" 
              value={assetId} 
              onChange={e => setAssetId(e.target.value)}
              required
            >
              <option value="">Select an asset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description of Issue</label>
            <textarea 
              className="w-full border p-2 rounded h-24" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="E.g. Screen is flickering..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Date</label>
            <input 
              type="date" 
              className="w-full border p-2 rounded" 
              value={scheduledDate} 
              onChange={e => setScheduledDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
