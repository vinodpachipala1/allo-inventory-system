import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import ProductGrid from "./ProductGrid";
import CleanupButton from "./CleanupButton";

export const dynamic = 'force-dynamic';

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      stock: { include: { warehouse: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    
    price: product.price.toNumber(), 
    
    stockByWarehouse: product.stock.map((stockItem) => ({
      warehouseId: stockItem.warehouseId,
      warehouseName: stockItem.warehouse.name,
      availableStock: stockItem.totalUnits - stockItem.reservedUnits,
    }))
  }));
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Allo Inventory</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          
          <CleanupButton />
          
          <Link href="/warehouses" className="flex-1 sm:flex-none">
            <Button 
              className="w-full active:scale-95 transition-transform duration-150 ease-in-out"
            >
              View Warehouses
            </Button>
          </Link>
          <Link href="/reservations" className="flex-1 sm:flex-none">
            <Button 
              className="w-full active:scale-95 transition-transform duration-150 ease-in-out"
            >
              View Reservations
            </Button>
          </Link>
        </div>
        
      </div>
      
      <ProductGrid products={products} />
    </main>
  );
}