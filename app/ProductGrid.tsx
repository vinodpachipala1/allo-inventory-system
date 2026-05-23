"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductGrid({ products }: { products: any[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQty = (id: string, val: number) => {
    if (val < 1) val = 1;
    setQuantities((prev) => ({ ...prev, [id]: val }));
  };

  if (!products || products.length === 0) {
    return <div className="text-center py-10">No products available.</div>;
  }

  return (

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col">
          
          <div className="relative h-40 w-full bg-white border-b rounded-t-lg">
            <Image 
              src={product.imageUrl || "/placeholder.png"} 
              alt={product.name} 
              fill
              className="object-contain p-4" 
            />
          </div>
          
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
              <span className="text-lg font-bold whitespace-nowrap">
                ₹ {product.price.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-1">{product.description}</p>
          </CardHeader>
          
          <CardContent className="p-4 pt-0 flex-grow flex flex-col">
            <div className="mt-auto space-y-2">
              <h3 className="font-medium text-xs text-slate-500 uppercase tracking-wider border-b pb-1 mb-2">
                Availability
              </h3>
              
              {product.stockByWarehouse.map((stock: any) => {
                const isOutOfStock = stock.availableStock <= 0;
                const stockKey = `${product.id}-${stock.warehouseId}`;
                
                return (
                  <div key={stock.warehouseId} className="flex flex-col gap-1.5 p-2 bg-slate-50 rounded-md border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{stock.warehouseName}</span>
                      <span className={`text-xs font-bold ${!isOutOfStock ? 'text-green-600' : 'text-red-500'}`}>
                        {!isOutOfStock ? `${stock.availableStock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        min="1" 
                        max={stock.availableStock}
                        defaultValue={1}
                        onChange={(e) => updateQty(stockKey, parseInt(e.target.value))}
                        className="w-20 bg-white h-8 text-sm"
                        disabled={isOutOfStock}
                      />
                      <Link 
                        href={`/checkout?productId=${product.id}&warehouseId=${stock.warehouseId}&qty=${quantities[stockKey] || 1}`}
                        className="flex-1"
                        onClick={(e) => isOutOfStock && e.preventDefault()}
                      >
                        <Button 
                          size="sm" 
                          className="w-full h-8" 
                          disabled={isOutOfStock}
                        >
                          Reserve
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}