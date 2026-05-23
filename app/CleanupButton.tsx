"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner"; // Assuming you have sonner installed from the checkout page!

export default function CleanupButton() {
  const [loading, setLoading] = useState(false);

  const handleCleanup = async () => {
    setLoading(true);
    try {
      // Assuming your route accepts GET. If it's a POST route, add { method: "POST" }
      const res = await fetch("/api/cron/cleanup"); 
      
      if (!res.ok) throw new Error("Cleanup failed");
      
      toast.success("Expired reservations successfully released!");
    } catch (error) {
      toast.error("Failed to run manual cleanup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleCleanup}
      disabled={loading}
      className="active:scale-95 transition-transform duration-150 ease-in-out gap-2 text-slate-600"
      title="Manually release expired reservations"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{loading ? "Cleaning..." : "Run Cleanup"}</span>
    </Button>
  );
}