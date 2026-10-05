import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

try {
  const [users, cars, bookings] = await Promise.all([
    prisma.user.count(),
    prisma.car.count(),
    prisma.booking.count(),
  ]);
  console.log({ users, cars, bookings });
} finally {
  await prisma.$disconnect();
}
