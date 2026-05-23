import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. LAZY CLEANUP: Release expired reservations
    const now = new Date();
    
    // Find all expired pending reservations
    const expiredReservations = await prisma.reservation.findMany({
      where: { status: 'PENDING', expiresAt: { lt: now } }
    });

    for (const res of expiredReservations) {
      await prisma.$transaction([
        prisma.reservation.update({
          where: { id: res.id },
          data: { status: 'RELEASED' }
        }),
        prisma.stock.update({
          where: { productId_warehouseId: { productId: res.productId, warehouseId: res.warehouseId } },
          data: { reservedUnits: { decrement: res.quantity } }
        })
      ]);
    }

    // 2. FETCH PRODUCTS
    const products = await prisma.product.findMany({
      include: {
        stock: { include: { warehouse: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockByWarehouse: product.stock.map((stockItem) => ({
        warehouseId: stockItem.warehouseId,
        warehouseName: stockItem.warehouse.name,
        totalUnits: stockItem.totalUnits,
        reservedUnits: stockItem.reservedUnits,
        availableStock: stockItem.totalUnits - stockItem.reservedUnits,
      }))
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}