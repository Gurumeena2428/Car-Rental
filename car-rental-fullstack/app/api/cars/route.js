import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import { cleanLocations, parseNonNegativeInteger, parsePositiveInteger, serializeCar } from "../../../lib/cars";
import { parseDateOnly } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = String(searchParams.get("q") ?? "").trim();
    const pickup = String(searchParams.get("pickup") ?? "").trim();
    const dropoff = String(searchParams.get("dropoff") ?? "").trim();
    const type = String(searchParams.get("type") ?? "").trim();
    const transmission = String(searchParams.get("transmission") ?? "").trim();
    const fuel = String(searchParams.get("fuel") ?? "").trim();
    const seats = parsePositiveInteger(searchParams.get("seats"));
    const minPrice = parseNonNegativeInteger(searchParams.get("minPrice"));
    const maxPrice = parseNonNegativeInteger(searchParams.get("maxPrice"));
    const pickupDate = parseDateOnly(searchParams.get("pickupDate"));
    const returnDate = parseDateOnly(searchParams.get("returnDate"));
    const includeInactive = searchParams.get("includeInactive") === "1";

    const and = [];

    if (q) {
      and.push({
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
          { type: { contains: q } },
        ],
      });
    }
    if (pickup) and.push({ locations: { some: { city: { contains: pickup } } } });
    if (dropoff) and.push({ locations: { some: { city: { contains: dropoff } } } });
    if (type) and.push({ type });
    if (transmission) and.push({ transmission });
    if (fuel) and.push({ fuel });
    if (seats) and.push({ seats: { gte: seats } });
    if (minPrice !== null) and.push({ pricePerDay: { gte: minPrice } });
    if (maxPrice !== null) and.push({ pricePerDay: { lte: maxPrice } });

    if (pickupDate && returnDate && returnDate >= pickupDate) {
      and.push({
        bookings: {
          none: {
            status: { in: ["PENDING", "CONFIRMED"] },
            pickupDate: { lte: returnDate },
            returnDate: { gte: pickupDate },
          },
        },
      });
    }

    let canSeeInactive = false;
    if (includeInactive) {
      const admin = await requireAdmin(request);
      canSeeInactive = Boolean(admin);
    }

    const where = {
      ...(canSeeInactive ? {} : { active: true }),
      ...(and.length ? { AND: and } : {}),
    };

    const cars = await prisma.car.findMany({
      where,
      include: { locations: { orderBy: { city: "asc" } } },
      orderBy: [{ active: "desc" }, { rating: "desc" }, { id: "asc" }],
      take: 100,
    });

    return NextResponse.json({ cars: cars.map(serializeCar) });
  } catch (error) {
    console.error("Cars GET error:", error);
    return NextResponse.json({ error: "Unable to load cars." }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const brand = String(body.brand ?? "").trim();
    const type = String(body.type ?? "").trim();
    const image = String(body.image ?? "").trim();
    const pricePerDay = parsePositiveInteger(body.pricePerDay);
    const seats = parsePositiveInteger(body.seats);
    const transmission = String(body.transmission ?? "").trim();
    const fuel = String(body.fuel ?? "").trim();
    const rating = Number(body.rating ?? 4.5);
    const reviews = parseNonNegativeInteger(body.reviews, 0);
    const locations = cleanLocations(body.locations);

    if (!name || !brand || !type || !image || !pricePerDay || !seats || !transmission || !fuel || !locations.length) {
      return NextResponse.json({ error: "Complete all required car fields and provide at least one location." }, { status: 400 });
    }

    const car = await prisma.car.create({
      data: {
        name,
        brand,
        type,
        image,
        pricePerDay,
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 4.5,
        reviews,
        seats,
        transmission,
        fuel,
        active: body.active !== false,
        locations: { create: locations.map((city) => ({ city })) },
      },
      include: { locations: true },
    });

    return NextResponse.json({ car: serializeCar(car) }, { status: 201 });
  } catch (error) {
    console.error("Cars POST error:", error);
    return NextResponse.json({ error: "Unable to create car." }, { status: 500 });
  }
}
