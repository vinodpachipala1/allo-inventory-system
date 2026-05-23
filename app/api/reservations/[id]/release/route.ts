import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) return { status: 404, body: { error: 'Reservation not found' } };
      if (reservation.status !== 'PENDING') return { status: 400, body: { error: `Cannot release a ${reservation.status} reservation` } };

      const releasedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'RELEASED' }
      });

      await tx.stock.update({
        where: {
          productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId }
        },
        data: { reservedUnits: { decrement: reservation.quantity } }
      });

      return { status: 200, body: releasedReservation };
    }, 
    // ADDED TIMEOUT SAFETY NET
    {
      maxWait: 10000, 
      timeout: 20000  
    });

    revalidatePath('/');
    return NextResponse.json(result.body, { status: result.status });

  } catch (error) {
    console.error("Release Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}