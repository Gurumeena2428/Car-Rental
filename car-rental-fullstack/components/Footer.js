import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Link href="/#home" className="footer-brand">RentalGo</Link>
        <p>© {new Date().getFullYear()} RentalGo. Next.js + React + Prisma.</p>
        <div className="footer-links">
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
