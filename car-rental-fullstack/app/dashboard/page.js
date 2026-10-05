"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function date(value) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/bookings?scope=mine", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load bookings.");
      setBookings(data.bookings ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/?auth=login");
      return;
    }
    loadBookings();
  }, [authLoading, user, router, loadBookings]);

  const totalCommitted = useMemo(
    () => bookings.filter((item) => ["CONFIRMED", "COMPLETED"].includes(item.status)).reduce((sum, item) => sum + item.totalPrice, 0),
    [bookings]
  );

  async function cancelBooking(id) {
    if (!window.confirm("Cancel this booking?")) return;
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cancellation failed.");
      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (authLoading || (!user && !error)) return <div className="page-loading">Checking your session…</div>;
  if (!user) return null;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="container dashboard-header-inner">
          <Link href="/" className="dashboard-brand">RentalGo</Link>
          <nav>
            <Link href="/#inventory">Browse Cars</Link>
            {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
            <button onClick={handleLogout}>Log out</button>
          </nav>
        </div>
      </header>

      <section className="container dashboard-content">
        <div className="dashboard-title-row">
          <div>
            <span className="eyebrow">Customer dashboard</span>
            <h1>Hello, {user.name}</h1>
            <p>{user.email}</p>
          </div>
          <Link className="primary-button" href="/#inventory">Book another car</Link>
        </div>

        <div className="dashboard-stats three">
          <article><span>Total bookings</span><strong>{bookings.length}</strong></article>
          <article><span>Active</span><strong>{bookings.filter((item) => ["PENDING", "CONFIRMED"].includes(item.status)).length}</strong></article>
          <article><span>Booked value</span><strong>{currency(totalCommitted)}</strong></article>
        </div>

        {error && <div className="state-card error-state">{error}</div>}
        {loading ? (
          <div className="state-card">Loading your bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="empty-dashboard">
            <h2>No bookings yet</h2>
            <p>Search the inventory and create your first database-backed reservation.</p>
            <Link className="primary-button" href="/#inventory">Find a car</Link>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <img src={booking.car.image} alt={booking.car.name} />
                <div className="booking-card-main">
                  <div className="booking-card-title">
                    <div>
                      <span className="muted-small">Booking #{booking.id}</span>
                      <h2>{booking.car.name}</h2>
                    </div>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                  </div>
                  <div className="booking-meta-grid">
                    <span><b>Route</b>{booking.pickupLocation} → {booking.dropoffLocation}</span>
                    <span><b>Pickup</b>{date(booking.pickupDate)}</span>
                    <span><b>Return</b>{date(booking.returnDate)}</span>
                    <span><b>Total</b>{currency(booking.totalPrice)} · {booking.totalDays} day{booking.totalDays === 1 ? "" : "s"}</span>
                  </div>
                  {["PENDING", "CONFIRMED"].includes(booking.status) && (
                    <button className="danger-outline-button" disabled={updatingId === booking.id} onClick={() => cancelBooking(booking.id)}>
                      {updatingId === booking.id ? "Cancelling…" : "Cancel booking"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
