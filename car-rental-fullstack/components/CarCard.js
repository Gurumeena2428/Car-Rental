function StarRating({ rating }) {
  const rounded = Math.round(rating);
  return (
    <div className="rating" aria-label={`${rating} out of 5 stars`}>
      <span className="stars">{"★".repeat(rounded)}{"☆".repeat(5 - rounded)}</span>
      <span>{rating.toFixed(1)}</span>
    </div>
  );
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CarCard({ car, onBook }) {
  return (
    <article className="car-card">
      <div className="car-image-wrap">
        <img src={car.image} alt={car.name} className="car-card-image" />
        <span className="car-type">{car.type}</span>
      </div>

      <div className="car-details">
        <div className="car-heading">
          <div>
            <span className="car-brand">{car.brand}</span>
            <h3>{car.name}</h3>
          </div>
          <StarRating rating={Number(car.rating)} />
        </div>
        <p className="reviews">{Number(car.reviews).toLocaleString("en-IN")} reviews</p>

        <div className="features">
          <span>👥 {car.seats} Seats</span>
          <span>⚙ {car.transmission}</span>
          <span>⛽ {car.fuel}</span>
          <span>📍 {car.locations.join(", ")}</span>
        </div>

        <div className="price-row">
          <div>
            <strong>{currency(car.pricePerDay)}</strong>
            <span>/day</span>
          </div>
          <button className="primary-button" onClick={() => onBook(car)}>Book Now</button>
        </div>
      </div>
    </article>
  );
}
