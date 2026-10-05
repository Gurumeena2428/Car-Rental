"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

const links = [
  ["Home", "/#home"],
  ["Rent Car", "/#inventory"],
  ["Contact Us", "/#contact"],
  ["About Us", "/#about"],
  ["Why Us", "/#why-us"],
];

export default function Navbar({ onLogin, onSignup }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main navigation">
        <Link className="brand" href="/#home" aria-label="RentalGo home">
          <img src="/logo.png" alt="RentalGo" />
        </Link>

        <button
          className="menu-button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          ☰
        </button>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
          {user && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
          )}
          {user && (
            <button className="mobile-logout" onClick={handleLogout}>Log out</button>
          )}
          {!loading && !user && (
            <div className="mobile-auth-actions">
              <button className="outline-button" onClick={() => { setMenuOpen(false); onLogin?.(); }}>Log in</button>
              <button className="primary-button" onClick={() => { setMenuOpen(false); onSignup?.(); }}>Sign Up</button>
            </div>
          )}
        </div>

        <div className="nav-actions">
          {loading ? (
            <span className="nav-loading">Checking session…</span>
          ) : user ? (
            <>
              <Link className="user-chip" href="/dashboard">
                {user.name.split(" ")[0]}
              </Link>
              {user.role === "ADMIN" && <Link className="outline-button" href="/admin">Admin</Link>}
              <button className="primary-button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <button className="outline-button" onClick={onLogin}>Log in</button>
              <button className="primary-button" onClick={onSignup}>Sign Up</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
