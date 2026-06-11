import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Softbade | AI & SaaS Discovery Platform",
  description:
    "Learn about Softbade, a platform helping professionals discover AI tools, SaaS software, productivity solutions, and business technology.",
  openGraph: {
    title: "About Softbade | AI & SaaS Discovery Platform",
    description:
      "Learn about Softbade, a platform helping professionals discover AI tools, SaaS software, productivity solutions, and business technology.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Softbade | AI & SaaS Discovery Platform",
    description:
      "Learn about Softbade, a platform helping professionals discover AI tools, SaaS software, productivity solutions, and business technology.",
  },
};

const discoveryCards = [
  {
    title: "AI Tools",
    description:
      "Discover powerful AI tools for writing, automation, productivity, design, and more.",
  },
  {
    title: "SaaS Software",
    description:
      "Explore business software across marketing, CRM, finance, and operations.",
  },
  {
    title: "Guides & Insights",
    description:
      "Read practical articles, comparisons, and industry updates.",
  },
  {
    title: "Curated Recommendations",
    description:
      "Find tools organized into categories for faster decision-making.",
  },
];

const audiences = [
  "Entrepreneurs",
  "Marketers",
  "Creators",
  "Startups",
  "Freelancers",
  "Business Teams",
];

const approach = [
  "Simplicity",
  "Practical recommendations",
  "Curated discoveries",
  "Easy comparison",
  "Continuous updates",
];

export default function AboutPage() {
  return (
    <main className="blog-page">
      <header className="blog-hero">
        <p className="blog-kicker">Softbade</p>
        <h1 className="blog-title">About Softbade</h1>
        <p className="blog-sub">
          Helping professionals discover the best AI and SaaS tools for productivity,
          automation, marketing, design, sales, and business growth.
        </p>
      </header>

      <section className="blog-section" aria-labelledby="mission-heading">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Our Mission</p>
          <h2 id="mission-heading">Our Mission</h2>
          <p>
            Softbade was created to simplify the discovery of AI and SaaS tools.
          </p>
          <p>
            With thousands of tools launching every year, finding the right solution
            can be overwhelming. Softbade helps professionals, founders, marketers,
            creators, and businesses explore curated tools faster and make better
            software decisions.
          </p>
        </div>
      </section>

      <section className="blog-section" aria-labelledby="find-heading">
        <div className="blog-section-header">
          <p className="blog-section-kicker">What You Will Find</p>
          <h2 id="find-heading">What You Will Find</h2>
        </div>

        <div className="related-grid">
          {discoveryCards.map((card) => (
            <article key={card.title} className="related-card">
              <span>Softbade</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="blog-section" aria-labelledby="audience-heading">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Who Softbade Is For</p>
          <h2 id="audience-heading">Who Softbade Is For</h2>
        </div>

        <div className="topic-tags">
          {audiences.map((audience) => (
            <a key={audience} href="/categories">
              {audience}
            </a>
          ))}
        </div>
      </section>

      <section className="blog-section" aria-labelledby="approach-heading">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Our Approach</p>
          <h2 id="approach-heading">Our Approach</h2>
          <p>Softbade focuses on:</p>
        </div>

        <div className="topic-tags">
          {approach.map((item) => (
            <a key={item} href="/categories">
              {item}
            </a>
          ))}
        </div>
      </section>

      <section className="blog-section" aria-labelledby="disclaimer-heading">
        <div className="related-card" style={{ minHeight: "auto" }}>
          <span>Disclosure</span>
          <h2 id="disclaimer-heading" style={{ margin: "14px 0 10px" }}>
            Disclaimer
          </h2>
          <p>
            Some links on Softbade may be affiliate links. This helps support the
            website at no additional cost to users. Recommendations are selected based
            on relevance and usefulness.
          </p>
        </div>
      </section>

      <section className="newsletter-section" aria-labelledby="about-cta-heading">
        <div>
          <p className="blog-section-kicker">Start Discovering</p>
          <h2 id="about-cta-heading">Explore AI Tools</h2>
          <p>
            Browse curated categories to compare AI tools, SaaS software, and business
            technology faster.
          </p>
        </div>

        <div>
          <a href="/categories" className="hero-main-btn">
            Browse Categories
          </a>
        </div>
      </section>
    </main>
  );
}
