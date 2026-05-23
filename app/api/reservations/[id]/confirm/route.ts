import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reservationId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });

      if (!reservation) throw new Error('NOT_FOUND');

      // CLEANUP ON EXPIRY
      if (new Date() > reservation.expiresAt && reservation.status === 'PENDING') {
        await tx.reservation.update({ where: { id: reservationId }, data: { status: 'RELEASED' } });
        await tx.stock.update({
          where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
          data: { reservedUnits: { decrement: reservation.quantity } }
        });
        throw new Error('EXPIRED');
      }

      if (reservation.status !== 'PENDING') throw new Error('INVALID_STATUS');

      // Proceed with confirmation
      const confirmedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED' }
      });

      await tx.stock.update({
        where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity }
        }
      });

      return { status: 200, body: confirmedReservation };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    if (error.message === 'EXPIRED') return NextResponse.json({ error: 'Reservation expired' }, { status: 410 });
    if (error.message === 'INVALID_STATUS') return NextResponse.json({ error: 'Cannot confirm' }, { status: 400 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}