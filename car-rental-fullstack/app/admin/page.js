"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

const EMPTY_CAR = {
  name: "",
  brand: "",
  type: "Sedan",
  image: "/verna.png",
  pricePerDay: "",
  rating: "4.5",
  reviews: "0",
  seats: "5",
  transmission: "Automatic",
  fuel: "Petrol",
  locations: "Mumbai, Pune",
  active: true,
};

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function date(value) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCar, setEditingCar] = useState(null);
  const [showCarForm, setShowCarForm] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsResponse, carsResponse, bookingsResponse] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/cars?includeInactive=1", { cache: "no-store" }),
        fetch("/api/bookings", { cache: "no-store" }),
      ]);
      const [statsData, carsData, bookingsData] = await Promise.all([
        statsResponse.json(), carsResponse.json(), bookingsResponse.json(),
      ]);
      if (!statsResponse.ok) throw new Error(statsData.error || "Unable to load statistics.");
      if (!carsResponse.ok) throw new Error(carsData.error || "Unable to load cars.");
      if (!bookingsResponse.ok) throw new Error(bookingsData.error || "Unable to load bookings.");
      setStats(statsData.stats);
      setCars(carsData.cars ?? []);
      setBookings(bookingsData.bookings ?? []);
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
    if (user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    loadAdminData();
  }, [authLoading, user, router, loadAdminData]);

  async function updateBookingStatus(id, status) {
    setError("");
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update booking.");
      return;
    }
    await loadAdminData();
  }

  async function toggleCar(car) {
    setError("");
    const response = await fetch(`/api/cars/${car.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !car.active }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update car.");
      return;
    }
    await loadAdminData();
  }

  function beginEdit(car) {
    setEditingCar({ ...car, locations: car.locations.join(", ") });
    setShowCarForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (authLoading || !user) return <div className="page-loading">Checking administrator access…</div>;
  if (user.role !== "ADMIN") return null;

  return (
    <main className="dashboard-page admin-page">
      <header className="dashboard-header dark">
        <div className="container dashboard-header-inner">
          <Link href="/" className="dashboard-brand">RentalGo Admin</Link>
          <nav>
            <Link href="/">Website</Link>
            <Link href="/dashboard">My bookings</Link>
            <button onClick={handleLogout}>Log out</button>
          </nav>
        </div>
      </header>

      <section className="container dashboard-content">
        <div className="dashboard-title-row">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Operations dashboard</h1>
            <p>Manage inventory, bookings, availability, and basic platform statistics.</p>
          </div>
          <button className="primary-button" onClick={() => { setEditingCar(null); setShowCarForm((value) => !value); }}>
            {showCarForm && !editingCar ? "Close form" : "+ Add car"}
          </button>
        </div>

        {error && <div className="state-card error-state">{error}</div>}

        {showCarForm && (
          <CarAdminForm
            initial={editingCar || EMPTY_CAR}
            carId={editingCar?.id}
            onCancel={() => { setShowCarForm(false); setEditingCar(null); }}
            onSaved={async () => { setShowCarForm(false); setEditingCar(null); await loadAdminData(); }}
            onError={setError}
          />
        )}

        {stats && (
          <div className="dashboard-stats admin-stats">
            <article><span>Customers</span><strong>{stats.users}</strong></article>
            <article><span>Active cars</span><strong>{stats.activeCars}/{stats.cars}</strong></article>
            <article><span>Bookings</span><strong>{stats.bookings}</strong></article>
            <article><span>Active rentals</span><strong>{stats.activeBookings}</strong></article>
            <article><span>Booked revenue</span><strong>{currency(stats.revenue)}</strong></article>
          </div>
        )}

        {loading ? <div className="state-card">Loading admin data…</div> : (
          <>
            <section className="admin-section">
              <div className="admin-section-heading">
                <div><h2>Car inventory</h2><p>{cars.length} database records</p></div>
              </div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Car</th><th>Price/day</th><th>Details</th><th>Locations</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {cars.map((car) => (
                      <tr key={car.id}>
                        <td><div className="table-car"><img src={car.image} alt="" /><div><strong>{car.name}</strong><span>{car.brand} · {car.type}</span></div></div></td>
                        <td>{currency(car.pricePerDay)}</td>
                        <td>{car.seats} seats · {car.transmission} · {car.fuel}</td>
                        <td>{car.locations.join(", ")}</td>
                        <td><span className={`status-badge ${car.active ? "status-confirmed" : "status-cancelled"}`}>{car.active ? "ACTIVE" : "ARCHIVED"}</span></td>
                        <td><div className="table-actions"><button onClick={() => beginEdit(car)}>Edit</button><button onClick={() => toggleCar(car)}>{car.active ? "Archive" : "Activate"}</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-heading">
                <div><h2>Bookings</h2><p>Update operational status for each reservation.</p></div>
              </div>
              <div className="table-wrap">
                <table className="admin-table booking-admin-table">
                  <thead><tr><th>ID</th><th>Customer</th><th>Car</th><th>Dates</th><th>Route</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr><td colSpan="7" className="empty-cell">No bookings yet.</td></tr>
                    ) : bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>#{booking.id}</td>
                        <td><strong>{booking.user?.name}</strong><br/><span className="muted-small">{booking.user?.email}</span></td>
                        <td>{booking.car.name}</td>
                        <td>{date(booking.pickupDate)} → {date(booking.returnDate)}</td>
                        <td>{booking.pickupLocation} → {booking.dropoffLocation}</td>
                        <td>{currency(booking.totalPrice)}</td>
                        <td>
                          <select className="status-select" value={booking.status} onChange={(e) => updateBookingStatus(booking.id, e.target.value)}>
                            <option>PENDING</option><option>CONFIRMED</option><option>CANCELLED</option><option>COMPLETED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function CarAdminForm({ initial, carId, onCancel, onSaved, onError }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    onError("");
    setSaving(true);
    try {
      const method = carId ? "PATCH" : "POST";
      const endpoint = carId ? `/api/cars/${carId}` : "/api/cars";
      const payload = {
        ...form,
        pricePerDay: Number(form.pricePerDay),
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        seats: Number(form.seats),
        locations: String(form.locations).split(",").map((item) => item.trim()).filter(Boolean),
      };
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save car.");
      await onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-form-heading">
        <div><h2>{carId ? `Edit ${initial.name}` : "Add a new car"}</h2><p>These values are stored in SQLite and served through the Cars API.</p></div>
        <button type="button" className="text-button" onClick={onCancel}>Close</button>
      </div>
      <div className="admin-form-grid">
        <label>Name<input required value={form.name} onChange={(e) => field("name", e.target.value)} /></label>
        <label>Brand<input required value={form.brand} onChange={(e) => field("brand", e.target.value)} /></label>
        <label>Type<input required value={form.type} onChange={(e) => field("type", e.target.value)} /></label>
        <label>Image path/URL<input required value={form.image} onChange={(e) => field("image", e.target.value)} /></label>
        <label>Price per day (₹)<input required min="1" type="number" value={form.pricePerDay} onChange={(e) => field("pricePerDay", e.target.value)} /></label>
        <label>Seats<input required min="1" type="number" value={form.seats} onChange={(e) => field("seats", e.target.value)} /></label>
        <label>Transmission<select value={form.transmission} onChange={(e) => field("transmission", e.target.value)}><option>Automatic</option><option>Manual</option></select></label>
        <label>Fuel<select value={form.fuel} onChange={(e) => field("fuel", e.target.value)}><option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option></select></label>
        <label>Rating<input min="0" max="5" step="0.1" type="number" value={form.rating} onChange={(e) => field("rating", e.target.value)} /></label>
        <label>Review count<input min="0" type="number" value={form.reviews} onChange={(e) => field("reviews", e.target.value)} /></label>
        <label className="wide-field">Locations (comma separated)<input required value={form.locations} onChange={(e) => field("locations", e.target.value)} placeholder="Mumbai, Pune, Delhi" /></label>
        <label className="checkbox-field"><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => field("active", e.target.checked)} /> Active and searchable</label>
      </div>
      <div className="admin-form-actions"><button className="outline-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving…" : carId ? "Save changes" : "Create car"}</button></div>
    </form>
  );
}
