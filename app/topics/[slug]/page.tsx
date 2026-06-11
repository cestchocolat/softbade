import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticlesForTopic,
  getTopicHub,
  getToolsForTopic,
  topicHubs,
} from "../topicData";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return topicHubs.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicHub(slug);

  if (!topic) {
    return {};
  }

  const title = `${topic.title} Topic Hub | Softbade`;
  const url = `https://softbade.com/topics/${topic.slug}`;

  return {
    title,
    description: topic.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: topic.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: topic.description,
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getTopicHub(slug);

  if (!topic) {
    notFound();
  }

  const relatedArticles = getArticlesForTopic(topic.slug);
  const featuredArticles = relatedArticles.slice(0, 6);
  const relatedTools = getToolsForTopic(topic.slug).slice(0, 8);

  return (
    <main className="blog-page">
      <nav className="article-meta seo-article-meta" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden>/</span>
        <a href="/blog">Topics</a>
        <span aria-hidden>/</span>
        <span>{topic.title}</span>
      </nav>

      <header className="blog-hero">
        <p className="blog-kicker">Topic Hub</p>
        <h1 className="blog-title">{topic.title}</h1>
        <p className="blog-sub">{topic.description}</p>
        <div className="article-meta seo-article-meta" style={{ justifyContent: "center" }}>
          <span>{relatedArticles.length} Related Articles</span>
          <span>{relatedTools.length} Related Tools</span>
        </div>
      </header>

      <section className="blog-section blog-featured" aria-labelledby="topic-featured">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Start Here</p>
          <h2 id="topic-featured">Featured Articles</h2>
          <p>
            Editorial guides and comparisons that help you understand {topic.title}
            workflows, tools, and software decisions.
          </p>
        </div>

        <div className="featured-grid">
          {featuredArticles.map((article) => (
            <article key={article.slug} className="featured-card">
              <a href={`/blog/${article.slug}`} className="featured-image-link" aria-label={article.title}>
                <img src={article.image} alt="" className="featured-image" />
              </a>
              <div className="featured-content">
                <div className="article-meta">
                  <a href={`/topics/${topic.slug}`}>{topic.title}</a>
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

      <section className="blog-section" aria-labelledby="topic-latest">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Browse Deeper</p>
          <h2 id="topic-latest">Latest Articles</h2>
        </div>

        <div className="latest-grid">
          {relatedArticles.map((article) => (
            <article key={article.slug} className="latest-card">
              <a href={`/blog/${article.slug}`} className="latest-image-link" aria-label={article.title}>
                <img src={article.image} alt="" className="latest-image" />
              </a>
              <div className="latest-content">
                <div className="article-meta">
                  <a href={`/topics/${topic.slug}`}>{topic.title}</a>
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

      <section className="blog-section" aria-labelledby="topic-tools">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Software Discovery</p>
          <h2 id="topic-tools">Related Tools</h2>
          <p>Tools and software profiles connected to this topic hub.</p>
        </div>

        <div className="related-grid">
          {relatedTools.map((tool) => (
            <a key={tool.slug} href={`/tools/${tool.slug}`} className="related-card">
              <span>{tool.categories[0]}</span>
              <h3>{tool.name}</h3>
              <p>{tool.tagline}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="blog-section" aria-labelledby="topic-categories">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Explore Categories</p>
          <h2 id="topic-categories">Related Categories</h2>
        </div>

        <div className="topic-tags">
          {topic.relatedCategories.map((category) => (
            <a key={category.href} href={category.href}>
              {category.title}
            </a>
          ))}
        </div>
      </section>

      <section className="newsletter-section" aria-labelledby="topic-newsletter">
        <div>
          <p className="blog-section-kicker">Weekly Briefing</p>
          <h2 id="topic-newsletter">Get the latest AI tools and workflows in your inbox</h2>
          <p>
            A concise digest of useful tools, practical workflows, product updates, and
            editorial picks from Softbade.
          </p>
        </div>

        <form className="newsletter-form">
          <label htmlFor="topic-newsletter-email">Email address</label>
          <div className="newsletter-controls">
            <input
              id="topic-newsletter-email"
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
