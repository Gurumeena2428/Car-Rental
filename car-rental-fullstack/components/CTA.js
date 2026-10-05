import Link from "next/link";

export default function CTA() {
  return (
    <section className="section cta-section" id="contact">
      <div className="cta-card container">
        <div className="cta-copy">
          <span className="eyebrow light">Start driving</span>
          <h2>Ready To Get Started?</h2>
          <p>Create an account, search live availability, make a booking, and manage it from your dashboard.</p>
          <Link className="white-button" href="/#inventory">Browse Cars</Link>
        </div>
        <div className="cta-visual">
          <img src="/verna.png" alt="Hyundai Verna" />
        </div>
      </div>
    </section>
  );
}
