"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchPanel from "../components/SearchPanel";
import Inventory from "../components/Inventory";
import WhyChooseUs from "../components/WhyChooseUs";
import Achievements from "../components/Achievements";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import { useAuth } from "../components/AuthProvider";

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function toQueryString(values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value).trim());
    }
  });
  return params.toString();
}

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [carsError, setCarsError] = useState("");
  const [search, setSearch] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [pendingCar, setPendingCar] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const hasHandledAuthParam = useRef(false);

  const loadCars = useCallback(async (filters = null) => {
    setLoadingCars(true);
    setCarsError("");
    try {
      const query = filters ? `?${toQueryString(filters)}` : "";
      const response = await fetch(`/api/cars${query}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load cars.");
      setCars(data.cars ?? []);
    } catch (error) {
      setCars([]);
      setCarsError(error.message);
    } finally {
      setLoadingCars(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  useEffect(() => {
    if (hasHandledAuthParam.current) return;
    hasHandledAuthParam.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "login") setAuthMode("login");
    if (params.get("auth") === "signup") setAuthMode("signup");
  }, []);

  function scrollToInventory() {
    document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSearch(values) {
    setSearch(values);
    setShowAll(true);
    await loadCars(values);
    setTimeout(scrollToInventory, 0);
  }

  function handleBook(car) {
    if (!user) {
      setPendingCar(car);
      setAuthMode("login");
      return;
    }
    setSelectedCar(car);
  }

  async function handleAuthSuccess() {
    const signedInUser = await refreshUser();
    setAuthMode(null);
    if (signedInUser && pendingCar) {
      setSelectedCar(pendingCar);
      setPendingCar(null);
    }
  }

  return (
    <>
      <Navbar onLogin={() => setAuthMode("login")} onSignup={() => setAuthMode("signup")} />
      <main>
        <Hero onRent={scrollToInventory} />
        <SearchPanel onSearch={handleSearch} searching={loadingCars && Boolean(search)} />
        <Inventory
          cars={cars}
          showAll={showAll}
          onToggleAll={() => setShowAll((current) => !current)}
          onBook={handleBook}
          loading={loadingCars}
          error={carsError}
          searched={Boolean(search)}
        />
        <WhyChooseUs />
        <Achievements />
        <CTA />
      </main>
      <Footer />

      <Modal
        open={Boolean(selectedCar)}
        title={selectedCar ? `Book ${selectedCar.name}` : "Book Car"}
        onClose={() => setSelectedCar(null)}
      >
        {selectedCar && (
          <BookingForm
            car={selectedCar}
            defaults={search}
            onDone={() => {
              setSelectedCar(null);
              loadCars(search);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(authMode)}
        title={authMode === "signup" ? "Create your account" : "Welcome back"}
        onClose={() => {
          setAuthMode(null);
          setPendingCar(null);
        }}
      >
        <AuthForm
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitch={(mode) => setAuthMode(mode)}
        />
      </Modal>
    </>
  );
}

function BookingForm({ car, defaults, onDone }) {
  const initialPickup = car.locations.includes(defaults?.pickup) ? defaults.pickup : car.locations[0];
  const initialDropoff = car.locations.includes(defaults?.dropoff) ? defaults.dropoff : car.locations[0];
  const [pickupLocation, setPickupLocation] = useState(initialPickup ?? "");
  const [dropoffLocation, setDropoffLocation] = useState(initialDropoff ?? "");
  const [pickupDate, setPickupDate] = useState(defaults?.pickupDate || todayOffset(1));
  const [returnDate, setReturnDate] = useState(defaults?.returnDate || todayOffset(3));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id, pickupLocation, dropoffLocation, pickupDate, returnDate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed.");
      setBooking(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (booking) {
    return (
      <div className="success-state">
        <div className="success-icon">✓</div>
        <h3>Booking confirmed</h3>
        <p>
          Booking #{booking.id} is saved in the database. Total: <strong>{formatCurrency(booking.totalPrice)}</strong>.
        </p>
        <div className="success-actions">
          <Link className="outline-button" href="/dashboard">Open Dashboard</Link>
          <button className="primary-button" onClick={onDone}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="booking-car-summary">
        <img src={car.image} alt="" />
        <div>
          <strong>{car.name}</strong>
          <span>{formatCurrency(car.pricePerDay)}/day</span>
        </div>
      </div>
      <label>
        Pick-up location
        <select value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required>
          {car.locations.map((location) => <option key={location}>{location}</option>)}
        </select>
      </label>
      <label>
        Drop location
        <select value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} required>
          {car.locations.map((location) => <option key={location}>{location}</option>)}
        </select>
      </label>
      <div className="two-column-form">
        <label>
          Pick-up date
          <input required type="date" min={todayOffset(0)} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
        </label>
        <label>
          Return date
          <input required type="date" min={pickupDate} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </label>
      </div>
      {error && <p className="inline-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Checking availability…" : "Confirm Booking"}
      </button>
      <p className="form-note">No payment gateway is included. The reservation itself is persisted in SQLite and affects future availability searches.</p>
    </form>
  );
}

function AuthForm({ mode, onSuccess, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      await onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {mode === "signup" && (
        <label>
          Full name
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" minLength={2} />
        </label>
      )}
      <label>
        Email
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      <label>
        Password
        <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" />
      </label>
      {error && <p className="inline-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Please wait…" : mode === "signup" ? "Create Account" : "Log In"}
      </button>
      <p className="auth-switch">
        {mode === "signup" ? "Already have an account?" : "New to RentalGo?"}{" "}
        <button type="button" onClick={() => onSwitch(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Log in" : "Create account"}
        </button>
      </p>
    </form>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
