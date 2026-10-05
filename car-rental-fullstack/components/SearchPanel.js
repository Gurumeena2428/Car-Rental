"use client";

import { useState } from "react";

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SearchPanel({ onSearch, searching }) {
  const [q, setQ] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupDate, setPickupDate] = useState(todayOffset(1));
  const [returnDate, setReturnDate] = useState(todayOffset(3));
  const [type, setType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");
  const [seats, setSeats] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (returnDate < pickupDate) {
      setError("Return date must be on or after the pick-up date.");
      return;
    }
    setError("");
    await onSearch({ q, pickup, dropoff, pickupDate, returnDate, type, transmission, fuel, seats });
  }

  function clearFilters() {
    setQ("");
    setPickup("");
    setDropoff("");
    setType("");
    setTransmission("");
    setFuel("");
    setSeats("");
  }

  return (
    <section className="search-section" aria-label="Search rental cars">
      <form className="search-panel container" onSubmit={handleSubmit}>
        <label>
          <span>Car / Brand</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="BMW, SUV, Verna…" />
        </label>

        <label>
          <span>Pick Up Location</span>
          <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Mumbai" />
        </label>

        <label>
          <span>Drop Location</span>
          <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Mumbai" />
        </label>

        <label>
          <span>Pick Up Date</span>
          <input type="date" value={pickupDate} min={todayOffset(0)} onChange={(e) => setPickupDate(e.target.value)} required />
        </label>

        <label>
          <span>Return Date</span>
          <input type="date" value={returnDate} min={pickupDate} onChange={(e) => setReturnDate(e.target.value)} required />
        </label>

        <label>
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any type</option>
            <option>Compact</option>
            <option>Sedan</option>
            <option>Luxury Sedan</option>
            <option>SUV</option>
            <option>Sports Car</option>
            <option>Supercar</option>
          </select>
        </label>

        <label>
          <span>Transmission</span>
          <select value={transmission} onChange={(e) => setTransmission(e.target.value)}>
            <option value="">Any</option>
            <option>Automatic</option>
            <option>Manual</option>
          </select>
        </label>

        <label>
          <span>Fuel</span>
          <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
            <option value="">Any</option>
            <option>Petrol</option>
            <option>Diesel</option>
            <option>Electric</option>
            <option>Hybrid</option>
          </select>
        </label>

        <label>
          <span>Minimum Seats</span>
          <select value={seats} onChange={(e) => setSeats(e.target.value)}>
            <option value="">Any</option>
            <option value="2">2+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
            <option value="7">7+</option>
          </select>
        </label>

        <div className="search-actions">
          <button className="primary-button search-button" type="submit" disabled={searching}>
            {searching ? "Searching…" : "Search Cars"}
          </button>
          <button className="text-button" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
        {error && <p className="search-error">{error}</p>}
      </form>
    </section>
  );
}
