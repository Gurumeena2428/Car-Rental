import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  try {
    const [users, cars, activeCars, bookings, activeBookings, revenue] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.car.count(),
      prisma.car.count({ where: { active: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        _sum: { totalPrice: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        users,
        cars,
        activeCars,
        bookings,
        activeBookings,
        revenue: revenue._sum.totalPrice ?? 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Unable to load admin statistics." }, { status: 500 });
  }
}
