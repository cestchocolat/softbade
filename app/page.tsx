
import { categoryHubArticles } from "./blog/categories";

// app/page.tsx

const categories = [
  "AI & Automation",
  "Marketing & SEO",
  "Productivity",
  "CRM & Sales",
  "Design & Creative",
  "Finance Tools",
];

const blogCategoryLabels: Record<string, string> = {
  "tool-roundups": "Tool Roundups",
  "workflow-ideas": "Workflow Ideas",
  "updates-insights": "Updates & Insights",
  "beginner-guides": "Beginner Guides",
  "creator-toolkit": "Creator Toolkit",
  "productivity-hacks": "Productivity Hacks",
};

const featuredArticleSlugs = [
  "best-ai-writing-tools-for-content-creators",
  "how-to-build-an-ai-content-workflow",
  "ai-product-launches-to-watch-2026",
  "what-is-chatgpt-and-how-does-it-work",
  "best-ai-tools-for-youtube-creators",
  "ai-productivity-system-for-busy-founders",
];

const homepageFeaturedArticles = featuredArticleSlugs
  .map((slug) => categoryHubArticles.find((article) => article.slug === slug))
  .filter((article): article is (typeof categoryHubArticles)[number] => Boolean(article));

export default function Home() {
  return (
    <main className="landing">
      {/* HERO */}
      <section className="hero-full">
        {/* ถ้าไม่ใช้ hero-kicker ก็คอมเมนต์ทิ้งไว้ได้ */}
        {/* <p className="hero-kicker">AI & SaaS tools for modern teams</p> */}

        <h1 className="hero-main">
          Unlock Future with
          {" "}
          <span className="hero-main-highlight">Softbade.</span>
        </h1>

        <p className="hero-sub">
          From automation to innovation, Softbade curates AI & SaaS tools that help
          you work faster, smarter, and more focused — across marketing, productivity,
          CRM, design, and finance.
        </p>

        <a href="/categories" className="hero-main-btn"
        style={{ marginTop: "30px" }}>
          Get started
        </a>
      </section>

<section className="category-row">
  <h2 className="category-heading">Explore by category</h2>

  <div className="category-pills">
    {categories.map((cat) => {
      const slug = cat
        .toLowerCase()
        .replace(/ & /g, "-")
        .replace(/\s+/g, "-");

      return (
        <a
          key={cat}
          href={`/categories/${slug}`}
          className="category-pill no-underline decoration-0"
        >
          {cat}
        </a>
      );
    })}
  </div>
</section>

      

     {/* BLOG / FEATURE CARDS — NOW 6 ITEMS */}
<section className="info-section">
  <div className="info-grid">
    {homepageFeaturedArticles.map((article) => {
      const articleHref = `/blog/${article.slug}`;
      const categoryHref = `/blog/${article.categoryHub}`;

      return (
      <article key={article.slug} className="info-card blog-category-card">
        <a href={articleHref} className="info-image" style={{ display: "block" }}>
          <img src={article.image} alt="" className="info-image-img" />
        </a>
        <h3 className="info-title">
          <a href={articleHref} style={{ color: "inherit", textDecoration: "none" }}>
            {article.title}
          </a>
        </h3>
        <a href={categoryHref} className="category-count" style={{ display: "inline-block", textDecoration: "none" }}>
          {blogCategoryLabels[article.categoryHub] ?? article.categoryHub}
        </a>
        <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
          {article.date} • {article.readTime}
        </p>
        <a href={articleHref} className="info-text" style={{ display: "block", textDecoration: "none" }}>
          {article.excerpt}
        </a>
        <a href={articleHref} className="category-card-cta" style={{ textDecoration: "none" }}>
          Read More →
        </a>
      </article>
      );
    })}

  </div>
  <div style={{ marginTop: "28px", textAlign: "center" }}>
    <a href="/blog" className="hero-main-btn">
      View all articles
    </a>
  </div>
</section>

<section className="what-softbade-section" aria-labelledby="what-softbade-title">
  <div className="what-softbade-card">
    <p className="what-softbade-kicker">AI &amp; SaaS Discovery</p>
    <h2 id="what-softbade-title">What is Softbade?</h2>

    <div className="what-softbade-copy">
      <p>
        Softbade is a curated AI tools directory and SaaS tools discovery platform
        built for professionals, creators, founders, marketers, and growing businesses
        that want to find the right software faster.
      </p>

      <p>
        It organizes AI tools, SaaS tools, productivity tools, marketing automation,
        CRM software, design tools, finance tools, and workflow automation solutions
        by practical category and real workflow value.
      </p>

      <div className="what-softbade-grid">
        <div>
          <h3>Discover AI and SaaS tools faster</h3>
          <p>
            Softbade helps users explore AI tools, productivity tools, marketing
            automation platforms, CRM software, design tools, finance tools, and
            workflow automation solutions without starting from zero. Each category is
            built around real business needs, helping visitors move from broad research
            to a useful shortlist quickly and choose software with more confidence.
          </p>
        </div>

        <div>
          <h3>Compare tools across categories</h3>
          <p>
            The best software decision is rarely about one feature in isolation.
            Teams need to understand how SaaS tools compare across pricing, use cases,
            integrations, ease of use, and workflow fit. Softbade groups tools into
            focused categories so founders, operators, and marketers can compare
            options based on the work they actually need to do.
          </p>
        </div>

        <div>
          <h3>Build smarter workflows</h3>
          <p>
            Softbade is more than a list of tools. It is a content hub for building
            better digital workflows with AI and SaaS products. Users can find software
            for a specific job, learn how tools work together, and create systems that
            save time, reduce manual tasks, improve output quality, and support daily
            work more consistently.
          </p>
        </div>
      </div>
    </div>

    <a href="/categories" className="what-softbade-cta">
      Explore Categories
    </a>
  </div>
</section>

<section
  style={{
    padding: "0px 0px",
    textAlign: "center",
  }}
>
  <div
    style={{
      maxWidth: "900px",
      margin: "0 auto",
    }}
  >
    <p style={{ marginBottom: "12px", color: "white" }}>Explore Tools by Category</p>

    <h2
      style={{
        marginBottom: "16px",
        color: "white",
        fontSize: "32px",
        fontWeight: 700,
      }}
    >
      Browse curated AI and SaaS tools across automation, marketing, productivity,
      CRM, design, and finance.
    </h2>



    <a
      href="/categories"
      style={{
        display: "inline-block",
    padding: "16px 36px",
    background: "linear-gradient(90deg, #7C83FF, #C084FC)",
    color: "white",
    borderRadius: "999px",
    textDecoration: "none",
    fontWeight: 600,
    marginTop: "25px",
    boxShadow: "0 8px 25px rgba(168,85,247,0.25)",
      }}
    >
      Browse Categories
    </a>
  </div>
</section>

    </main>
  );
}
