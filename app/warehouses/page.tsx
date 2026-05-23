import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import WarehouseClient from "./WarehouseClient"; 

export const dynamic = 'force-dynamic';

async function getWarehousesWithProducts() {
  const warehouses = await prisma.warehouse.findMany({
    include: {
      stock: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { name: 'asc' }
  });

  return warehouses.map(warehouse => {
    // THE FIX: Destructure the object to remove the raw 'stock' array 
    // so it doesn't get sent to the Client Component at all.
    const { stock, ...safeWarehouseData } = warehouse;
    
    return {
      ...safeWarehouseData,
      inventory: stock.map(stockItem => ({
        product: {
          ...stockItem.product,
          price: stockItem.product.price.toNumber(), // Safely converted
        },
        availableStock: stockItem.totalUnits - stockItem.reservedUnits,
        totalUnits: stockItem.totalUnits
      }))
    };
  });
}

export default async function WarehousesPage() {
  const warehouses = await getWarehousesWithProducts();

  return (
    <main className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hub Inventory</h1>
          <p className="text-slate-500 mt-1 text-sm">Browse available products by warehouse location</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2 active:scale-95 transition-transform duration-150">
            <Home className="h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>

      <WarehouseClient warehouses={warehouses} />
      
    </main>
  );
}