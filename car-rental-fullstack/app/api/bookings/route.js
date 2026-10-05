import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import { calculateRentalDays, parseDateOnly } from "../../../lib/dates";

export const dynamic = "force-dynamic";

function serializeBooking(booking) {
  return {
    id: booking.id,
    userId: booking.userId,
    carId: booking.carId,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    pickupDate: booking.pickupDate,
    returnDate: booking.returnDate,
    totalDays: booking.totalDays,
    totalPrice: booking.totalPrice,
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    car: booking.car
      ? {
          id: booking.car.id,
          name: booking.car.name,
          brand: booking.car.brand,
          image: booking.car.image,
          pricePerDay: booking.car.pricePerDay,
        }
      : undefined,
    user: booking.user
      ? { id: booking.user.id, name: booking.user.name, email: booking.user.email }
      : undefined,
  };
}

export async function GET(request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const adminAll = user.role === "ADMIN" && request.nextUrl.searchParams.get("scope") !== "mine";
    const bookings = await prisma.booking.findMany({
      where: adminAll ? {} : { userId: user.id },
      include: {
        car: true,
        ...(adminAll ? { user: { select: { id: true, name: true, email: true } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    return NextResponse.json({ bookings: bookings.map(serializeBooking) });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ error: "Unable to load bookings." }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in before booking a car." }, { status: 401 });

  try {
    const body = await request.json();
    const carId = Number(body.carId);
    const pickupLocation = String(body.pickupLocation ?? "").trim();
    const dropoffLocation = String(body.dropoffLocation ?? "").trim();
    const pickupDate = parseDateOnly(body.pickupDate);
    const returnDate = parseDateOnly(body.returnDate);

    if (!Number.isInteger(carId) || carId <= 0 || !pickupLocation || !dropoffLocation || !pickupDate || !returnDate) {
      return NextResponse.json({ error: "Complete all booking fields." }, { status: 400 });
    }
    if (returnDate < pickupDate) {
      return NextResponse.json({ error: "Return date must not be before pickup date." }, { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (pickupDate < today) {
      return NextResponse.json({ error: "Pickup date cannot be in the past." }, { status: 400 });
    }

    const totalDays = calculateRentalDays(pickupDate, returnDate);

    const booking = await prisma.$transaction(async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: carId },
        include: { locations: true },
      });
      if (!car || !car.active) throw new Error("CAR_NOT_FOUND");

      const supported = new Set(car.locations.map((item) => item.city.toLowerCase()));
      if (!supported.has(pickupLocation.toLowerCase()) || !supported.has(dropoffLocation.toLowerCase())) {
        throw new Error("UNSUPPORTED_LOCATION");
      }

      const conflict = await tx.booking.findFirst({
        where: {
          carId,
          status: { in: ["PENDING", "CONFIRMED"] },
          pickupDate: { lte: returnDate },
          returnDate: { gte: pickupDate },
        },
      });
      if (conflict) throw new Error("CAR_UNAVAILABLE");

      return tx.booking.create({
        data: {
          userId: user.id,
          carId,
          pickupLocation,
          dropoffLocation,
          pickupDate,
          returnDate,
          totalDays,
          totalPrice: totalDays * car.pricePerDay,
          status: "CONFIRMED",
        },
        include: { car: true },
      });
    });

    return NextResponse.json({ booking: serializeBooking(booking) }, { status: 201 });
  } catch (error) {
    if (error?.message === "CAR_NOT_FOUND") return NextResponse.json({ error: "Car not found or inactive." }, { status: 404 });
    if (error?.message === "UNSUPPORTED_LOCATION") return NextResponse.json({ error: "This car is not available at both selected locations." }, { status: 400 });
    if (error?.message === "CAR_UNAVAILABLE") return NextResponse.json({ error: "This car is already booked for part of the selected date range." }, { status: 409 });

    console.error("Bookings POST error:", error);
    return NextResponse.json({ error: "Unable to create booking." }, { status: 500 });
  }
}
