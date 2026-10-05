import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const cars = [
  {
    name: "Lamborghini Huracán",
    brand: "Lamborghini",
    type: "Supercar",
    image: "/lambo.png",
    pricePerDay: 45000,
    rating: 4.9,
    reviews: 1082,
    seats: 2,
    transmission: "Automatic",
    fuel: "Petrol",
    locations: ["Mumbai", "Delhi", "Surat"],
  },
  {
    name: "BMW 5 Series",
    brand: "BMW",
    type: "Luxury Sedan",
    image: "/bmw-22428.png",
    pricePerDay: 12500,
    rating: 4.8,
    reviews: 846,
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    locations: ["Mumbai", "Pune", "Ahmedabad"],
  },
  {
    name: "Hyundai Verna",
    brand: "Hyundai",
    type: "Sedan",
    image: "/verna.png",
    pricePerDay: 3800,
    rating: 4.6,
    reviews: 622,
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    locations: ["Surat", "Ahmedabad", "Jaipur"],
  },
  {
    name: "Ford Mustang",
    brand: "Ford",
    type: "Sports Car",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80",
    pricePerDay: 22000,
    rating: 4.8,
    reviews: 731,
    seats: 4,
    transmission: "Automatic",
    fuel: "Petrol",
    locations: ["Delhi", "Mumbai", "Bengaluru"],
  },
  {
    name: "Range Rover Evoque",
    brand: "Land Rover",
    type: "SUV",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80",
    pricePerDay: 15500,
    rating: 4.7,
    reviews: 514,
    seats: 5,
    transmission: "Automatic",
    fuel: "Diesel",
    locations: ["Mumbai", "Bengaluru", "Goa"],
  },
  {
    name: "Premium City Car",
    brand: "RentalGo",
    type: "Compact",
    image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=900&q=80",
    pricePerDay: 2900,
    rating: 4.5,
    reviews: 403,
    seats: 5,
    transmission: "Manual",
    fuel: "Petrol",
    locations: ["Surat", "Pune", "Jaipur"],
  },
];

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { name, email, role, passwordHash },
  });
}

async function main() {
  await upsertUser({
    name: "RentalGo Admin",
    email: "admin@rentalgo.local",
    password: "Admin@12345",
    role: "ADMIN",
  });

  await upsertUser({
    name: "Demo User",
    email: "user@rentalgo.local",
    password: "User@12345",
    role: "USER",
  });

  for (const car of cars) {
    const existing = await prisma.car.findFirst({ where: { name: car.name } });

    if (existing) {
      await prisma.carLocation.deleteMany({ where: { carId: existing.id } });
      await prisma.car.update({
        where: { id: existing.id },
        data: {
          brand: car.brand,
          type: car.type,
          image: car.image,
          pricePerDay: car.pricePerDay,
          rating: car.rating,
          reviews: car.reviews,
          seats: car.seats,
          transmission: car.transmission,
          fuel: car.fuel,
          active: true,
          locations: {
            create: car.locations.map((city) => ({ city })),
          },
        },
      });
    } else {
      await prisma.car.create({
        data: {
          ...car,
          locations: {
            create: car.locations.map((city) => ({ city })),
          },
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin: admin@rentalgo.local / Admin@12345");
  console.log("User:  user@rentalgo.local / User@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
