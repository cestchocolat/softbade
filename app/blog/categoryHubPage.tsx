import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryHubArticles, getBlogCategory } from "./categories";

type CategoryHubPageProps = {
  slug: string;
};

export function CategoryHubPage({ slug }: CategoryHubPageProps) {
  const category = getBlogCategory(slug);
  const articles = categoryHubArticles.filter((article) => article.categoryHub === slug);

  if (!category || articles.length === 0) {
    notFound();
  }

  return (
    <main className="blog-page">
      <section className="category-hub-hero">
        <a href="/blog" className="blog-back-link">
          Back to Blog
        </a>
        <p className="blog-kicker">{category.title}</p>
        <h1 className="blog-title">{category.title} Articles and Resources</h1>
        <p className="blog-sub">{category.description}</p>
      </section>

      <section className="blog-section category-hub-section" aria-labelledby="category-articles">
        <div className="blog-section-header">
          <p className="blog-section-kicker">Content Hub</p>
          <h2 id="category-articles">Latest {category.title} Guides</h2>
          <p>
            Browse practical Softbade articles with cover images, SEO-focused topics,
            clear excerpts, publish dates, read times, and direct links to complete guides.
          </p>
        </div>

        <div className="category-article-grid">
          {articles.map((article) => (
            <article key={article.slug} className="category-article-card">
              <a href={`/blog/${article.slug}`} className="category-article-image-link">
                <img src={article.image} alt="" className="category-article-image" />
              </a>
              <div className="category-article-content">
                <div className="article-meta">
                  <a href={`/blog/${slug}`}>{category.title}</a>
                  <span>{article.readTime}</span>
                </div>
                <h3>
                  <a href={`/blog/${article.slug}`}>{article.title}</a>
                </h3>
                <p>{article.excerpt}</p>
                <div className="category-article-footer">
                  <time dateTime={article.dateTime}>{article.date}</time>
                  <a href={`/blog/${article.slug}`}>Read Article →</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function getCategoryHubMetadata(slug: string): Metadata {
  const category = getBlogCategory(slug);

  if (!category) {
    return {};
  }

  return {
    title: `${category.title} Articles and Resources | Softbade Blog`,
    description: category.description,
    openGraph: {
      title: `${category.title} Articles and Resources | Softbade Blog`,
      description: category.description,
      type: "website",
      images: [category.image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.title} Articles and Resources | Softbade Blog`,
      description: category.description,
      images: [category.image],
    },
  };
}
