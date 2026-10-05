import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";
import { cleanLocations, parseNonNegativeInteger, parsePositiveInteger, serializeCar } from "../../../../lib/cars";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid car id." }, { status: 400 });

    const car = await prisma.car.findUnique({
      where: { id },
      include: { locations: true },
    });
    if (!car || !car.active) return NextResponse.json({ error: "Car not found." }, { status: 404 });

    return NextResponse.json({ car: serializeCar(car) });
  } catch (error) {
    console.error("Car GET error:", error);
    return NextResponse.json({ error: "Unable to load car." }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid car id." }, { status: 400 });

    const body = await request.json();
    const current = await prisma.car.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Car not found." }, { status: 404 });

    const data = {};
    for (const field of ["name", "brand", "type", "image", "transmission", "fuel"]) {
      if (body[field] !== undefined) {
        const value = String(body[field]).trim();
        if (!value) return NextResponse.json({ error: `${field} cannot be empty.` }, { status: 400 });
        data[field] = value;
      }
    }
    if (body.pricePerDay !== undefined) {
      const value = parsePositiveInteger(body.pricePerDay);
      if (!value) return NextResponse.json({ error: "pricePerDay must be a positive integer." }, { status: 400 });
      data.pricePerDay = value;
    }
    if (body.seats !== undefined) {
      const value = parsePositiveInteger(body.seats);
      if (!value) return NextResponse.json({ error: "seats must be a positive integer." }, { status: 400 });
      data.seats = value;
    }
    if (body.reviews !== undefined) {
      const value = parseNonNegativeInteger(body.reviews);
      if (value === null) return NextResponse.json({ error: "reviews must be zero or greater." }, { status: 400 });
      data.reviews = value;
    }
    if (body.rating !== undefined) {
      const value = Number(body.rating);
      if (!Number.isFinite(value) || value < 0 || value > 5) {
        return NextResponse.json({ error: "rating must be between 0 and 5." }, { status: 400 });
      }
      data.rating = value;
    }
    if (body.active !== undefined) data.active = Boolean(body.active);

    const locations = body.locations !== undefined ? cleanLocations(body.locations) : null;
    if (locations && !locations.length) {
      return NextResponse.json({ error: "Provide at least one location." }, { status: 400 });
    }

    const car = await prisma.$transaction(async (tx) => {
      await tx.car.update({ where: { id }, data });
      if (locations) {
        await tx.carLocation.deleteMany({ where: { carId: id } });
        await tx.carLocation.createMany({ data: locations.map((city) => ({ carId: id, city })) });
      }
      return tx.car.findUnique({ where: { id }, include: { locations: true } });
    });

    return NextResponse.json({ car: serializeCar(car) });
  } catch (error) {
    console.error("Car PATCH error:", error);
    return NextResponse.json({ error: "Unable to update car." }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid car id." }, { status: 400 });

    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return NextResponse.json({ error: "Car not found." }, { status: 404 });

    await prisma.car.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Car DELETE error:", error);
    return NextResponse.json({ error: "Unable to archive car." }, { status: 500 });
  }
}
