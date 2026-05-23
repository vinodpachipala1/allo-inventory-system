"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Package } from "lucide-react";

export default function WarehouseClient({ warehouses }: { warehouses: any[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQty = (key: string, val: number, max: number) => {
    if (isNaN(val) || val < 1) val = 1;
    if (val > max) val = max;
    setQuantities((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-12">
      {warehouses.map((warehouse) => {
        const uniqueItems = warehouse.inventory.length;
        const totalVolume = warehouse.inventory.reduce((sum: number, item: any) => sum + item.availableStock, 0);

        return (
          <section key={warehouse.id} className="border rounded-xl p-6 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Package className="h-6 w-6 text-emerald-600" />
                  {warehouse.name}
                </h2>
                <p className="text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {warehouse.location}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-slate-100 text-slate-700">
                  {uniqueItems} Unique Products
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm border-emerald-200 text-emerald-700 bg-emerald-50">
                  {totalVolume} Total Units
                </Badge>
              </div>
            </div>

            {uniqueItems > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {warehouse.inventory.map(({ product, availableStock }: any) => {
                  const isOutOfStock = availableStock <= 0;
                  const stockKey = `${product.id}-${warehouse.id}`;
                  const currentQty = quantities[stockKey] || 1;

                  return (
                    <Card key={product.id} className="flex flex-col overflow-hidden hover:border-slate-300 transition-colors">
                      
                      {/* THE FIX: Changed bg-slate-50 to bg-white, added rounded-t-lg, and used object-contain p-4 */}
                      <div className="relative h-32 w-full bg-white border-b rounded-t-lg">
                        <Image 
                          src={product.imageUrl || "/placeholder.png"} 
                          alt={product.name} 
                          fill
                          className="object-contain p-4" 
                        />
                      </div>

                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm line-clamp-1" title={product.name}>
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">
                            ₹ {product.price.toString()}
                          </span>
                          <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                            {isOutOfStock ? 'Empty' : `${availableStock} units`}
                          </span>
                        </div>
                        
                        {isOutOfStock ? (
                          <Button size="sm" className="w-full h-8 text-xs mt-1 bg-slate-100 text-slate-400" disabled>
                            Out of Stock
                          </Button>
                        ) : (
                          <div className="flex gap-2 mt-1">
                            <Input 
                              type="number" 
                              min="1" 
                              max={availableStock}
                              value={currentQty}
                              onChange={(e) => updateQty(stockKey, parseInt(e.target.value), availableStock)}
                              className="w-16 h-8 text-xs px-2 text-center"
                            />
                            <Link 
                              href={`/checkout?productId=${product.id}&warehouseId=${warehouse.id}&qty=${currentQty}`}
                              className="flex-1"
                            >
                              <Button size="sm" className="w-full h-8 text-xs">
                                Reserve
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">No products currently stocked in this warehouse.</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}