import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";

const ADMIN_STATUSES = new Set(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

export async function PATCH(request, context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body.status ?? "").toUpperCase();
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    if (user.role !== "ADMIN") {
      if (booking.userId !== user.id) return NextResponse.json({ error: "You cannot edit this booking." }, { status: 403 });
      if (status !== "CANCELLED") return NextResponse.json({ error: "Users can only cancel their bookings." }, { status: 400 });
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        return NextResponse.json({ error: "This booking can no longer be cancelled." }, { status: 400 });
      }
    } else if (!ADMIN_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
    }

    if (["PENDING", "CONFIRMED"].includes(status) && !["PENDING", "CONFIRMED"].includes(booking.status)) {
      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          carId: booking.carId,
          status: { in: ["PENDING", "CONFIRMED"] },
          pickupDate: { lte: booking.returnDate },
          returnDate: { gte: booking.pickupDate },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: "Cannot reactivate this booking because the car is already booked for those dates." }, { status: 409 });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { car: true, user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Booking PATCH error:", error);
    return NextResponse.json({ error: "Unable to update booking." }, { status: 500 });
  }
}
