import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  const [reservations, warehouses] = await Promise.all([
    prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true }
    }),
    prisma.warehouse.findMany()
  ]);

  const warehouseMap = new Map(warehouses.map(w => [w.id, w]));

  return (
    <main className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">All Reservations</h1>
        <Link href="/">
          <Button variant="outline" className="gap-2 w-full sm:w-auto active:scale-95 transition-transform duration-150">
            <Home className="h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reservations.map((res) => {
          const warehouse = warehouseMap.get(res.warehouseId);

          return (
            <Card key={res.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              
              {/* THE FIX: Changed bg-slate-100 to bg-white, changed object-cover to object-contain p-4 */}
              <div className="relative h-40 w-full bg-white border-b">
                <Image 
                  src={res.product.imageUrl || "/placeholder.png"} 
                  alt={res.product.name} 
                  fill
                  className="object-contain p-4" 
                />
              </div>

              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-md leading-tight">{res.product.name}</CardTitle>
                  <Badge variant={res.status === 'CONFIRMED' ? 'default' : res.status === 'RELEASED' ? 'destructive' : 'secondary'}>
                    {res.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 text-sm flex-grow flex flex-col justify-end">
                <p className="mb-3"><span className="font-semibold text-slate-700">Qty Reserved:</span> {res.quantity}</p>
                
                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <p className="font-semibold text-slate-800">
                    {warehouse?.name || "Unknown Hub"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {warehouse?.location || "Unknown Location"}
                  </p>
                </div> 
                
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                  Expires: {new Date(res.expiresAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}