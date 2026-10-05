export default function Hero({ onRent }) {
  return (
    <section className="hero" id="home">
      <div className="hero-inner container">
        <div className="hero-copy">
          <span className="eyebrow">Drive your journey</span>
          <h1>
            Easy And Fast Way To <span>Rent</span> Your Car
          </h1>
          <p>
            Find a car for city rides, road trips, and business travel. Compare
            available vehicles and start a booking from one simple interface.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={onRent}>Rent Car</button>
            <a className="text-link" href="#why-us">Why RentalGo →</a>
          </div>
        </div>

        <div className="hero-visual" aria-label="BMW rental car">
          <div className="hero-glow" />
          <img src="/bmw-22428.png" alt="BMW car" />
        </div>
      </div>
    </section>
  );
}
