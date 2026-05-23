import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // THE FIX: Explicitly parse the quantity as a Base-10 Integer. 
    // If it's missing or invalid, it gracefully falls back to 1.
    const quantity = parseInt(String(body.quantity), 10) || 1;
    const { productId, warehouseId } = body;
    
    const idempotencyKey = request.headers.get("x-idempotency-key");

    if (!productId || !warehouseId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // IDEMPOTENCY CHECK
    if (idempotencyKey) {
      const existing = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) return NextResponse.json(existing.responseBody, { status: existing.responseStatus });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current stock state
      const stock = await tx.stock.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } }
      });

      if (!stock || (stock.totalUnits - stock.reservedUnits) < quantity) {
        throw new Error('OUT_OF_STOCK');
      }

      // 2. Atomic update
      const updated = await tx.stock.updateMany({
        where: {
          id: stock.id,
          reservedUnits: stock.reservedUnits 
        },
        data: { reservedUnits: { increment: quantity } } // This will now correctly increment by 2, 3, etc.
      });

      if (updated.count === 0) {
        throw new Error('CONCURRENCY_CONFLICT'); 
      }

      const reservation = await tx.reservation.create({
        data: { 
          productId, 
          warehouseId, 
          quantity, // Saves the correct quantity to the database
          status: 'PENDING', 
          expiresAt: new Date(Date.now() + 600000) 
        }
      });

      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: { key: idempotencyKey, requestPath: "/api/reservations", responseStatus: 200, responseBody: reservation as any, reservationId: reservation.id }
        });
      }
      return { status: 200, body: reservation };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    if (error.message === 'OUT_OF_STOCK') return NextResponse.json({ error: 'Out of stock' }, { status: 409 });
    if (error.message === 'CONCURRENCY_CONFLICT') return NextResponse.json({ error: 'Please retry' }, { status: 409 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}