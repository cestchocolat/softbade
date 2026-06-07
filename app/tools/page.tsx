export default function AllCategoriesPage() {
  const cats = [
    { name: "AI & Automation", slug: "ai-automation", tone: "sft-tone-ai" },
    { name: "Marketing & SEO", slug: "marketing-seo", tone: "sft-tone-mkt" },
    { name: "Productivity", slug: "productivity", tone: "sft-tone-pro" },
    { name: "CRM & Sales", slug: "crm-sales", tone: "sft-tone-crm" },
    { name: "Design & Creative", slug: "design-creative", tone: "sft-tone-des" },
    { name: "Finance Tools", slug: "finance-tools", tone: "sft-tone-fin" },
    
  ];

  return (
    <main className="sft-cats">
      <header className="sft-cats__header">
        <h1 className="sft-cats__title">Explore Categories</h1>
        <p className="sft-cats__sub">
          Curated AI & SaaS tools—pick a category to start.
        </p>
      </header>

      <section className="sft-cats__grid">
        {cats.map((c) => (
          <a
            key={c.slug}
            href={`/categories/${c.slug}`}
            className={`sft-card ${c.tone}`}
          >
            <div className="sft-card__inner">
              <h2 className="sft-card__title">{c.name}</h2>

              <div className="sft-card__footer">
                <span className="sft-card__hint">Explore</span>
                <span className="sft-card__arrow" aria-hidden>
                  →
                </span>
              </div>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
