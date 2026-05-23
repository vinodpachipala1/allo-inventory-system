"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function CheckoutFlow() {
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId");
  const warehouseId = searchParams.get("warehouseId");
  
  // THE FIX: Extract quantity from the URL, parse it, and default to 1 if missing
  const qtyParam = searchParams.get("qty");
  const parsedQty = qtyParam ? parseInt(qtyParam, 10) : 1;
  const quantity = isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty;

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [processing, setProcessing] = useState(false);

  const hasAttemptedReserve = useRef(false);

  useEffect(() => {
    if (!productId || !warehouseId) {
      setError("Missing product or warehouse information.");
      setLoading(false);
      return;
    }

    if (hasAttemptedReserve.current) return;
    hasAttemptedReserve.current = true;

    const savedSession = sessionStorage.getItem(`allo_res_${productId}`);
    if (savedSession) {
      const parsedData = JSON.parse(savedSession);
      const expiryTime = new Date(parsedData.expiresAt).getTime();

      if (expiryTime > Date.now()) {
        setReservation(parsedData);
        setTimeLeft(Math.floor((expiryTime - Date.now()) / 1000));
        setLoading(false);
        return;
      } else {
        sessionStorage.removeItem(`allo_res_${productId}`);
      }
    }

    const reserveItem = async () => {
      // Idempotency Key generated on the client
      const idempotencyKey = crypto.randomUUID();

      try {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-idempotency-key": idempotencyKey
          },
          // THE FIX: Send the dynamic quantity to your API!
          body: JSON.stringify({ productId, warehouseId, quantity }), 
        });

        const data = await res.json();

        if (res.status === 409) {
          setError("Someone else just grabbed the last unit! Out of stock.");
          toast.error("Stock conflict");
        } else if (!res.ok) {
          setError(data.error || "Failed to reserve item");
        } else {
          setReservation(data);
          sessionStorage.setItem(`allo_res_${productId}`, JSON.stringify(data));

          const expiryTime = new Date(data.expiresAt).getTime();
          setTimeLeft(Math.floor((expiryTime - Date.now()) / 1000));
        }
      } catch (err) {
        setError("Network error occurred.");
      } finally {
        setLoading(false);
      }
    };

    reserveItem();
  }, [productId, warehouseId, quantity]); // Added quantity to dependency array

  useEffect(() => {
    if (!reservation || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, timeLeft]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, { method: "POST" });

      if (res.status === 410) {
        setError("Your reservation has expired.");
        toast.error("Reservation Expired");
        return;
      }
      if (!res.ok) throw new Error("Server rejected confirm");

      toast.success("Payment Processed & Purchase Confirmed!");
      sessionStorage.removeItem(`allo_res_${productId}`);
      window.location.href = "/";
    } catch (err) {
      toast.error("Failed to confirm purchase.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, { method: "POST" });
      if (!res.ok) throw new Error("Server rejected release");

      toast.success("Reservation released.");
      sessionStorage.removeItem(`allo_res_${productId}`);
      window.location.href = "/";
    } catch (err) {
      toast.error("Failed to release reservation.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Locking inventory...</div>;

  if (error || timeLeft <= 0) {
    return (
      <main className="container mx-auto py-20 px-4 max-w-lg flex justify-center">
        <Card className="w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Checkout Failed</CardTitle>
            <CardDescription>{timeLeft <= 0 ? "Your 10-minute reservation expired." : error}</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <Button className="w-full" variant="outline" onClick={() => { window.location.href = "/"; }}>
              Return to Products
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <main className="container mx-auto py-10 px-4 max-w-lg flex justify-center pb-24">
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>We've temporarily held this item for you.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleConfirm} className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
              <span className="font-medium">Time Remaining:</span>
              <span className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Shipping Details</h3>
                <input required type="text" placeholder="Full Name" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                <input required type="text" placeholder="Street Address" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h3 className="font-semibold text-sm">Payment Information</h3>
                <input required type="text" placeholder="Card Number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="MM/YY" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  <input required type="text" placeholder="CVC" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-6 border-t mt-4">
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={processing}>
                Confirm Payment
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleCancel} disabled={processing}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading checkout...</div>}>
      <CheckoutFlow />
    </Suspense>
  );
}