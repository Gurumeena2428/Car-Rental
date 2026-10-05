import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

export const metadata = {
  title: "RentalGo | Full-Stack Car Rental",
  description: "A full-stack car-rental platform built with Next.js, React, Prisma, SQLite, authentication, APIs, and dashboards.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
