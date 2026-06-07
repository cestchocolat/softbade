import { blogCategories } from "./categories";
import { featuredArticles, latestArticles, topicSlug } from "./articles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Softbade Blog | AI Tools, SaaS Guides, Workflows and Reviews",
  description:
    "Explore Softbade's AI and SaaS publication with tool roundups, workflow ideas, beginner guides, creator toolkits, productivity tips, and in-depth article resources.",
  openGraph: {
    title: "Softbade Blog | AI Tools, SaaS Guides, Workflows and Reviews",
    description:
      "Explore practical AI tools, SaaS products, workflow automation guides, productivity systems, and content resources from Softbade.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Softbade Blog | AI Tools, SaaS Guides, Workflows and Reviews",
    description:
      "Explore practical AI tools, SaaS products, workflow automation guides, productivity systems, and content resources from Softbade.",
  },
};

const popularTopics = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "AI Writing",
  "Automation",
  "Productivity",
  "Marketing",
  "SaaS",
  "Startups",
  "No-Code",
];

export default function BlogPage() {
  return (
    <main className="blog-page">
      <header className="blog-hero">
        <p className="blog-kicker">Softbade Blog</p>
        <h1 className="blog-title">Ideas, guides, and tool stacks for smarter work</h1>
        <p className="blog-sub">
          Explore curated Softbade content by category, from tool roundups and beginner
          guides to practical workflows and product updates.
        </p>
      </header>

      <section className="blog-section blog-featured" aria-labelledby="featured-articles">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Editor's Picks</p>
          <h2 id="featured-articles">Featured Articles</h2>
          <p>
            Deep dives and practical guides for choosing better AI tools, evaluating
            SaaS products, and building workflows that compound.
          </p>
        </div>

        <div className="featured-grid">
          {featuredArticles.map((article) => (
            <article key={article.slug} className="featured-card">
              <a
                href={`/blog/${article.slug}`}
                className="featured-image-link"
                aria-label={article.title}
              >
                <img src={article.image} alt="" className="featured-image" />
              </a>
              <div className="featured-content">
                <div className="article-meta">
                  <a href={`/blog/topics/${topicSlug(article.category)}`}>{article.category}</a>
                  <time dateTime={article.dateTime}>{article.date}</time>
                </div>
                <h3>
                  <a href={`/blog/${article.slug}`}>{article.title}</a>
                </h3>
                <p>{article.excerpt}</p>
                <a href={`/blog/${article.slug}`} className="read-more-link">
                  Read More
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="blog-section blog-categories" aria-labelledby="blog-categories">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Browse by Intent</p>
          <h2 id="blog-categories">Content Categories</h2>
          <p>
            Start with the format that matches how you work: tool lists, practical
            workflows, or product updates and trend analysis.
          </p>
        </div>

        <div className="info-grid">
          {blogCategories.map((category) => (
            <a key={category.href} href={category.href} className="info-card blog-category-card">
              <div className="info-image">
                <img src={category.image} alt="" className="info-image-img" />
              </div>
              <h3 className="info-title">{category.title}</h3>
              <p className="category-count">{category.count}</p>
              <p className="info-text">{category.description}</p>
              <span className="category-card-cta">Explore Category →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="blog-section" aria-labelledby="latest-articles">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Fresh Guides</p>
          <h2 id="latest-articles">Latest Articles</h2>
          <p>
            A launch-ready library of practical content across AI writing, marketing,
            automation, productivity, SaaS reviews, and workflow design.
          </p>
        </div>

        <div className="latest-grid">
          {latestArticles.map((article) => (
            <article key={article.slug} className="latest-card">
              <a
                href={`/blog/${article.slug}`}
                className="latest-image-link"
                aria-label={article.title}
              >
                <img src={article.image} alt="" className="latest-image" />
              </a>
              <div className="latest-content">
                <div className="article-meta">
                  <a href={`/blog/topics/${topicSlug(article.category)}`}>{article.category}</a>
                  <time dateTime={article.dateTime}>{article.date}</time>
                </div>
                <h3>
                  <a href={`/blog/${article.slug}`}>{article.title}</a>
                </h3>
                <p>{article.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="blog-section topics-section" aria-labelledby="popular-topics">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Explore Faster</p>
          <h2 id="popular-topics">Popular Topics</h2>
        </div>

        <div className="topic-tags">
          {popularTopics.map((topic) => (
            <a key={topic} href={`/blog/topics/${topicSlug(topic)}`}>
              {topic}
            </a>
          ))}
        </div>
      </section>

      <section className="newsletter-section" aria-labelledby="newsletter-heading">
        <div>
          <p className="blog-section-kicker">Weekly Briefing</p>
          <h2 id="newsletter-heading">Get the latest AI tools and workflows in your inbox</h2>
          <p>
            A concise digest of useful tools, practical workflows, product updates, and
            editorial picks from Softbade.
          </p>
        </div>

        <form className="newsletter-form">
          <label htmlFor="newsletter-email">Email address</label>
          <div className="newsletter-controls">
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button type="submit">Subscribe</button>
          </div>
        </form>
      </section>
    </main>
  );
}
