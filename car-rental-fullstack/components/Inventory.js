import CarCard from "./CarCard";

export default function Inventory({ cars, showAll, onToggleAll, onBook, loading, error, searched }) {
  const visibleCars = showAll ? cars : cars.slice(0, 3);

  return (
    <section className="section inventory-section" id="inventory">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Explore the fleet</span>
          <h2>{searched ? "Search " : "Latest "}<span>Inventory</span></h2>
          <p>{searched ? "Results are loaded from the database and checked against existing bookings." : "Choose from database-backed premium, sedan, SUV, and compact options."}</p>
        </div>

        {loading && <div className="state-card">Loading cars from the database…</div>}
        {error && <div className="state-card error-state">{error}</div>}
        {!loading && !error && visibleCars.length === 0 && (
          <div className="state-card">No available car matches those filters and dates. Try another location, date range, or car type.</div>
        )}

        {!loading && !error && visibleCars.length > 0 && (
          <div className="car-grid">
            {visibleCars.map((car) => <CarCard key={car.id} car={car} onBook={onBook} />)}
          </div>
        )}

        {!loading && cars.length > 3 && (
          <div className="center-action">
            <button className="outline-button" onClick={onToggleAll}>
              {showAll ? "Show Less" : "View All Cars"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
