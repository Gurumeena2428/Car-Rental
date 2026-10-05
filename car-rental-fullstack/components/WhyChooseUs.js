const reasons = [
  {
    icon: "☎",
    title: "24 Hour Support",
    text: "A support-ready interface for helping customers throughout the rental journey.",
  },
  {
    icon: "⚑",
    title: "Transparent Pricing",
    text: "Daily prices and the calculated booking total are shown before confirmation.",
  },
  {
    icon: "✓",
    title: "Live Availability",
    text: "Search checks the database and excludes cars with overlapping active bookings.",
  },
  {
    icon: "↺",
    title: "Easy Cancellation",
    text: "Signed-in users can cancel active reservations directly from their dashboard.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="section why-section" id="why-us">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">RentalGo benefits</span>
          <h2>Why <span>Choose</span> Us</h2>
          <p>The customer experience is now connected to real application state and database operations.</p>
        </div>

        <div className="reason-grid">
          {reasons.map((reason) => (
            <article className="reason-card" key={reason.title}>
              <div className="reason-icon" aria-hidden="true">{reason.icon}</div>
              <div>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
