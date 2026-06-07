import type { CSSProperties } from "react";

const categories = [
  {
    name: "AI & Automation",
    href: "/categories/ai-automation",
    count: "48 Tools",
    icon: "AI",
    visual: "network",
    accent: "#8b7cff",
    border: "rgba(139, 124, 255, 0.42)",
    glow: "rgba(99, 102, 241, 0.24)",
    description:
      "Discover AI assistants, workflow automation platforms, chatbots, and AI-powered productivity systems.",
    examples: ["AI Agents", "Automation", "Chatbots"],
  },
  {
    name: "Marketing & SEO",
    href: "/categories/marketing-seo",
    count: "36 Tools",
    icon: "SEO",
    visual: "analytics",
    accent: "#34d399",
    border: "rgba(52, 211, 153, 0.36)",
    glow: "rgba(20, 184, 166, 0.2)",
    description:
      "Explore SEO software, content planning tools, analytics platforms, and marketing automation systems.",
    examples: ["SEO Tools", "Email Automation", "Content Marketing"],
  },
  {
    name: "Productivity",
    href: "/categories/productivity",
    count: "42 Tools",
    icon: "✓",
    visual: "tasks",
    accent: "#60a5fa",
    border: "rgba(96, 165, 250, 0.38)",
    glow: "rgba(59, 130, 246, 0.2)",
    description:
      "Find productivity tools for tasks, notes, calendars, collaboration, focus, and everyday workflow management.",
    examples: ["Task Apps", "Notes", "Planning"],
  },
  {
    name: "CRM & Sales",
    href: "/categories/crm-sales",
    count: "28 Tools",
    icon: "CRM",
    visual: "pipeline",
    accent: "#f59e0b",
    border: "rgba(245, 158, 11, 0.36)",
    glow: "rgba(245, 158, 11, 0.18)",
    description:
      "Compare CRM software, lead tracking tools, sales automation platforms, and outreach systems.",
    examples: ["CRM Software", "Lead Tracking", "Sales Outreach"],
  },
  {
    name: "Design & Creative",
    href: "/categories/design-creative",
    count: "31 Tools",
    icon: "✦",
    visual: "creative",
    accent: "#f472b6",
    border: "rgba(244, 114, 182, 0.38)",
    glow: "rgba(217, 70, 239, 0.18)",
    description:
      "Browse design tools for creative teams, AI image generation, video editing, mockups, and brand assets.",
    examples: ["AI Design", "Video Editing", "Brand Assets"],
  },
  {
    name: "Finance Tools",
    href: "/categories/finance-tools",
    count: "24 Tools",
    icon: "↗",
    visual: "finance",
    accent: "#d9f99d",
    border: "rgba(217, 249, 157, 0.34)",
    glow: "rgba(250, 204, 21, 0.16)",
    description:
      "Discover finance tools for invoicing, budgeting, forecasting, expense tracking, and business reporting.",
    examples: ["Invoicing", "Budgeting", "Forecasting"],
  },
];

const popularTools = [
  {
    name: "Jasper AI",
    category: "AI & Automation",
    description: "AI writing platform for content creation, campaigns, and marketing teams.",
    logo: "JA",
    href: "/tools/jasper-ai",
  },
  {
    name: "Notion AI",
    category: "Productivity",
    description: "Workspace assistant for notes, docs, summaries, and team knowledge.",
    logo: "NA",
    href: "/blog/notion-ai-review-modern-workspace",
  },
  {
    name: "Zapier",
    category: "AI & Automation",
    description: "No-code automation platform for connecting apps and workflows.",
    logo: "ZA",
    href: "/blog/zapier-vs-make-automation-platform",
  },
  {
    name: "Canva",
    category: "Design & Creative",
    description: "Design platform for social content, brand assets, and marketing visuals.",
    logo: "CA",
    href: "/blog/canva-magic-studio-review-marketing-teams",
  },
  {
    name: "HubSpot",
    category: "CRM & Sales",
    description: "CRM and marketing platform for contacts, campaigns, and sales pipelines.",
    logo: "HS",
    href: "/categories/crm-sales",
  },
  {
    name: "Airtable",
    category: "Productivity",
    description: "Flexible database and operations platform for lightweight business systems.",
    logo: "AT",
    href: "/blog/airtable-review-lightweight-operations-teams",
  },
];

const cardStyle = {
  borderRadius: "24px",
  border: "1px solid rgba(148, 163, 184, 0.34)",
  background:
    "radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 44%), rgba(11, 17, 32, 0.94)",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.86)",
} as const;

function CategoryVisual({ type, accent }: { type: string; accent: string }) {
  const baseProps = {
    width: "260",
    height: "180",
    viewBox: "0 0 260 180",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style: {
      position: "absolute",
      right: "-18px",
      bottom: "-14px",
      width: "250px",
      maxWidth: "72%",
      height: "auto",
      opacity: 0.14,
      pointerEvents: "none",
      zIndex: 0,
    } as const,
  };

  if (type === "network") {
    return (
      <svg {...baseProps}>
        <path d="M52 120L102 72L158 96L210 45" stroke={accent} strokeWidth="3" />
        <circle cx="52" cy="120" r="14" stroke={accent} strokeWidth="3" />
        <circle cx="102" cy="72" r="18" stroke={accent} strokeWidth="3" />
        <circle cx="158" cy="96" r="16" stroke={accent} strokeWidth="3" />
        <circle cx="210" cy="45" r="20" stroke={accent} strokeWidth="3" />
        <path d="M96 132C122 154 170 156 205 126" stroke={accent} strokeWidth="2" />
      </svg>
    );
  }

  if (type === "analytics") {
    return (
      <svg {...baseProps}>
        <rect x="42" y="42" width="176" height="104" rx="18" stroke={accent} strokeWidth="3" />
        <path d="M70 118L103 92L132 104L177 67" stroke={accent} strokeWidth="4" />
        <rect x="72" y="58" width="42" height="8" rx="4" fill={accent} />
        <rect x="72" y="135" width="28" height="8" rx="4" fill={accent} />
        <rect x="112" y="128" width="28" height="15" rx="4" fill={accent} />
        <rect x="152" y="112" width="28" height="31" rx="4" fill={accent} />
      </svg>
    );
  }

  if (type === "tasks") {
    return (
      <svg {...baseProps}>
        <rect x="48" y="36" width="164" height="114" rx="18" stroke={accent} strokeWidth="3" />
        <path d="M75 70H185" stroke={accent} strokeWidth="3" />
        <path d="M75 100H185" stroke={accent} strokeWidth="3" />
        <path d="M75 130H155" stroke={accent} strokeWidth="3" />
        <path d="M78 68L86 76L101 60" stroke={accent} strokeWidth="4" />
        <path d="M78 98L86 106L101 90" stroke={accent} strokeWidth="4" />
      </svg>
    );
  }

  if (type === "pipeline") {
    return (
      <svg {...baseProps}>
        <rect x="38" y="52" width="52" height="82" rx="16" stroke={accent} strokeWidth="3" />
        <rect x="104" y="36" width="52" height="114" rx="16" stroke={accent} strokeWidth="3" />
        <rect x="170" y="68" width="52" height="66" rx="16" stroke={accent} strokeWidth="3" />
        <path d="M91 92H103M157 92H169" stroke={accent} strokeWidth="3" />
        <circle cx="64" cy="76" r="8" fill={accent} />
        <circle cx="130" cy="62" r="8" fill={accent} />
        <circle cx="196" cy="92" r="8" fill={accent} />
      </svg>
    );
  }

  if (type === "creative") {
    return (
      <svg {...baseProps}>
        <circle cx="88" cy="88" r="42" stroke={accent} strokeWidth="3" />
        <circle cx="88" cy="88" r="14" fill={accent} />
        <rect x="137" y="46" width="70" height="70" rx="18" stroke={accent} strokeWidth="3" />
        <path d="M151 131C172 112 194 112 215 131" stroke={accent} strokeWidth="4" />
        <path d="M158 81H186M172 67V95" stroke={accent} strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
      <rect x="48" y="42" width="164" height="104" rx="18" stroke={accent} strokeWidth="3" />
      <path d="M72 124L105 94L132 110L184 66" stroke={accent} strokeWidth="4" />
      <path d="M74 62H126" stroke={accent} strokeWidth="4" />
      <rect x="74" y="134" width="20" height="8" rx="4" fill={accent} />
      <rect x="108" y="126" width="20" height="16" rx="4" fill={accent} />
      <rect x="142" y="112" width="20" height="30" rx="4" fill={accent} />
      <rect x="176" y="92" width="20" height="50" rx="4" fill={accent} />
    </svg>
  );
}

export default function CategoriesHubPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "72px 24px 88px",
        background:
          "radial-gradient(circle at top, rgba(79, 70, 229, 0.34), transparent 58%), #020617",
      }}
    >
      <style>{`
        .category-card-link {
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .category-card-link:hover {
          transform: translateY(-4px);
          border-color: var(--accent-border) !important;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.92), 0 0 42px var(--accent-glow) !important;
        }

        .category-card-link:hover .category-card-cta {
          color: var(--accent);
        }

      `}</style>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <header style={{ maxWidth: "780px", marginBottom: "30px" }}>
          <p
            style={{
              margin: "0 0 10px",
              color: "#a5b4fc",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Softbade Categories
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(38px, 6vw, 58px)",
              lineHeight: 1.06,
            }}
          >
            Explore AI and SaaS Tools by Category
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              color: "#cbd5e1",
              fontSize: "16px",
              lineHeight: 1.75,
            }}
          >
            Browse curated software categories built around real workflows, from AI
            automation and marketing to productivity, CRM, design, and finance.
          </p>
        </header>

        <section
          aria-label="Tool categories"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {categories.map((category) => (
            <a
              key={category.href}
              href={category.href}
              className="category-card-link"
              style={{
                ...cardStyle,
                "--accent": category.accent,
                "--accent-border": category.border,
                "--accent-glow": category.glow,
                position: "relative",
                display: "flex",
                minHeight: "260px",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                padding: "24px",
                border: `1px solid ${category.border}`,
                background: `radial-gradient(circle at top left, ${category.glow}, transparent 46%), rgba(11, 17, 32, 0.94)`,
                boxShadow: `0 24px 70px rgba(15, 23, 42, 0.86), 0 0 30px ${category.glow}`,
                color: "#ffffff",
                textDecoration: "none",
              } as CSSProperties}
            >
              <CategoryVisual type={category.visual} accent={category.accent} />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: "24px",
                  width: "3px",
                  height: "58px",
                  borderRadius: "0 999px 999px 0",
                  background: category.accent,
                  boxShadow: `0 0 22px ${category.accent}`,
                  opacity: 0.68,
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "20px",
                  zIndex: 2,
                  display: "grid",
                  placeItems: "center",
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  border: `1px solid ${category.border}`,
                  background: `radial-gradient(circle at top left, ${category.glow}, rgba(255,255,255,0.055))`,
                  boxShadow: `0 0 26px ${category.glow}`,
                  color: category.accent,
                  fontWeight: 800,
                }}
              >
                {category.icon}
              </div>
              <div style={{ position: "relative", zIndex: 2 }}>
                <h2 style={{ margin: 0, paddingRight: "76px", fontSize: "24px" }}>
                  {category.name}
                </h2>
                <p
                  style={{
                    margin: "14px 0 0",
                    color: "#cbd5e1",
                    fontSize: "14px",
                    lineHeight: 1.65,
                  }}
                >
                  {category.description}
                </p>
                <p
                  style={{
                    margin: "18px 0 0",
                    color: category.accent,
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {category.count}
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "rgba(255,255,255,0.74)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {category.examples.join(" • ")}
                </p>
              </div>
              <span
                className="category-card-cta"
                style={{
                  position: "relative",
                  zIndex: 2,
                  marginTop: "22px",
                  color: "#ffffff",
                  fontWeight: 800,
                  transition: "color 180ms ease",
                }}
              >
                Explore Category →
              </span>
            </a>
          ))}
        </section>

        <section style={{ marginTop: "78px" }} aria-labelledby="popular-tools-heading">
          <div style={{ maxWidth: "760px", marginBottom: "24px" }}>
            <p
              style={{
                margin: "0 0 10px",
                color: "#a5b4fc",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Tool Discovery
            </p>
            <h2 id="popular-tools-heading" style={{ margin: 0, fontSize: "clamp(28px, 4vw, 42px)" }}>
              Popular Tools
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
              gap: "16px",
            }}
          >
            {popularTools.map((tool) => (
              <article key={tool.name} style={{ ...cardStyle, padding: "18px" }}>
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "42px",
                    height: "42px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  {tool.logo}
                </div>
                <p
                  style={{
                    margin: "14px 0 8px",
                    color: "#a5b4fc",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {tool.category}
                </p>
                <h3 style={{ margin: 0, fontSize: "18px" }}>{tool.name}</h3>
                <p style={{ margin: "10px 0 16px", color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6 }}>
                  {tool.description}
                </p>
                <a href={tool.href} style={{ color: "#c4b5fd", fontSize: "14px", fontWeight: 800 }}>
                  View Tool
                </a>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: "78px" }} aria-labelledby="trending-categories-heading">
          <h2 id="trending-categories-heading" style={{ margin: "0 0 20px", fontSize: "clamp(28px, 4vw, 42px)" }}>
            Trending Categories
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              ["Most popular category", "AI & Automation", "/categories/ai-automation"],
              ["Most viewed category", "Marketing & SEO", "/categories/marketing-seo"],
              ["Recently updated category", "Productivity", "/categories/productivity"],
            ].map(([label, name, href]) => (
              <a key={label} href={href} style={{ ...cardStyle, padding: "20px", color: "#ffffff", textDecoration: "none" }}>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#a5b4fc",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </p>
                <h3 style={{ margin: 0, fontSize: "20px" }}>{name}</h3>
              </a>
            ))}
          </div>
        </section>

        <section style={{ ...cardStyle, marginTop: "78px", padding: "30px" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 42px)" }}>
            Find the Right AI and SaaS Tools by Category
          </h2>
          <p style={{ margin: "16px 0 0", color: "#cbd5e1", fontSize: "15px", lineHeight: 1.78 }}>
            Softbade organizes AI and SaaS tools into practical categories so users can
            discover, compare, and choose software faster. Start with the type of
            work you want to improve, then browse focused categories for automation,
            marketing, productivity, CRM and sales, design, or finance. Each section
            is built around real workflows so professionals, creators, founders,
            marketers, and teams can quickly understand which tools fit their goals.
          </p>
          <p style={{ margin: "16px 0 0", color: "#cbd5e1", fontSize: "15px", lineHeight: 1.78 }}>
            Use the Categories Hub to compare SEO tools, marketing automation
            platforms, CRM software, productivity tools, design tools, finance tools,
            AI writing software, and workflow automation platforms without sorting
            through unrelated products. The result is a clearer path from software
            discovery to a smarter operating stack. Whether you are building a lean
            startup toolkit, improving content operations, or modernizing internal
            business processes, Softbade helps narrow the search to relevant SaaS
            tools before you commit time or budget.
          </p>
        </section>

      </div>
    </main>
  );
}
