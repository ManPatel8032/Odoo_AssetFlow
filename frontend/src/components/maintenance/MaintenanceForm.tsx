"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MaintenanceForm({ open, onOpenChange, onSuccess }: MaintenanceFormProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [assetId, setAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    if (open) {
      setAssetId("");
      setDescription("");
      setScheduledDate("");
      setError("");
      fetchAssets();
    }
  }, [open]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/assets`);
      if (response.ok) {
        const data = await response.json();
        // Allow creating maintenance tickets for allocated or available assets
        setAssets(data);
      }
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  };

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
        const data = await response.json();
        throw new Error(data.error || "Failed to create maintenance ticket");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Raise Maintenance Request</DialogTitle>
          <DialogDescription>
            Schedule a repair or routine maintenance for an asset.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={setAssetId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.length === 0 ? (
                  <SelectItem value="none" disabled>No assets found</SelectItem>
                ) : (
                  assets.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.tag})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description of Issue</Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="E.g. Screen is flickering or needs routine cleaning..."
              className="resize-none h-24"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Scheduled Date</Label>
            <Input 
              type="date" 
              value={scheduledDate} 
              onChange={e => setScheduledDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
