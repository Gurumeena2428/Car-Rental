const stats = [
  ["4,000+", "Active Members"],
  ["3,000+", "Available Variants"],
  ["6,000+", "Car Models"],
  ["10K+", "Positive Ratings"],
];

export default function Achievements() {
  return (
    <section className="section achievements" id="about">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Growing community</span>
          <h2>Our <span>Achievement</span></h2>
          <p>Showcase metrics retained from the original visual design; replace them with real production analytics when you deploy.</p>
        </div>

        <div className="stats-grid">
          {stats.map(([value, label]) => (
            <div className="stat-card" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
