"use client";

import { useState, useEffect } from "react";

export default function BookingForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [assetId, setAssetId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    // In a real app we'd fetch actual bookable assets. 
    // We'll mock a few for now since we are in mock mode.
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

    if (!assetId || !startDate || !startTime || !endDate || !endTime) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }

    const start_time = new Date(`${startDate}T${startTime}:00`).toISOString();
    const end_time = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(start_time) >= new Date(end_time)) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId, start_time, end_time })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create booking");
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
        <h2 className="text-xl font-bold mb-4">New Resource Booking</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resource / Asset</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full border p-2 rounded" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input 
                type="time" 
                className="w-full border p-2 rounded" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full border p-2 rounded" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input 
                type="time" 
                className="w-full border p-2 rounded" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
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
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
