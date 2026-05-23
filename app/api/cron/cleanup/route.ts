import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  // Security: In production, you would check for an authorization header here
  // to ensure only your Cron Service can trigger this endpoint.

  try {
    // 1. Find all reservations that are still PENDING but have expired
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() } // "lt" means Less Than (the current time)
      }
    });

    if (expiredReservations.length === 0) {
      return NextResponse.json({ message: 'Clean sweep: No expired reservations found.' });
    }

    // 2. Safely release all expired stock in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      let releasedCount = 0;

      for (const reservation of expiredReservations) {
        // Put the stock back on the shelf
        await tx.stock.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            }
          },
          data: {
            reservedUnits: { decrement: reservation.quantity }
          }
        });

        // Update the reservation status so we don't process it again
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'RELEASED' } 
        });

        releasedCount++;
      }
      return releasedCount;
    });

    // Force the home page to update its stock counts for the next visitor
    revalidatePath('/');

    return NextResponse.json({ 
      status: 'Success', 
      message: `Reclaimed ${result} expired reservations and returned them to public stock.` 
    });

  } catch (error) {
    console.error("Cron Cleanup Error:", error);
    return NextResponse.json({ error: 'Failed to execute cron cleanup.' }, { status: 500 });
  }
}