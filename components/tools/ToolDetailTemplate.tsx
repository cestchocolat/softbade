import type { CSSProperties, ReactNode } from "react";
import type { ToolProfile } from "../../app/tools/toolData";
import {
  getRelatedArticlesForTool,
  getToolTopicSlugs,
  getTopicHub,
} from "../../app/topics/topicData";

const pageStyle = {
  minHeight: "100vh",
  padding: "64px 24px 86px",
  background:
    "radial-gradient(circle at top left, rgba(124, 131, 255, 0.24), transparent 34%), radial-gradient(circle at top right, rgba(34, 211, 238, 0.14), transparent 34%), radial-gradient(circle at 50% 38%, rgba(168, 85, 247, 0.08), transparent 38%), #020617",
  color: "#ffffff",
} as const;

const shellStyle = {
  maxWidth: "1120px",
  margin: "0 auto",
} as const;

const cardStyle = {
  border: "1px solid rgba(148, 163, 184, 0.26)",
  borderRadius: "24px",
  background: "rgba(11, 17, 32, 0.88)",
  boxShadow: "0 24px 70px rgba(2, 6, 23, 0.62)",
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: "clamp(26px, 4vw, 38px)",
  lineHeight: 1.15,
} as const;

const mutedTextStyle = {
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.75,
} as const;

const quickFactIcons: Record<string, string> = {
  Company: "CO",
  Founded: "YR",
  "Best For": "BF",
};

const alternativeAccents: Record<string, { accent: string; border: string; glow: string; badge: string }> = {
  "Jasper AI": {
    accent: "#f59e0b",
    border: "rgba(245, 158, 11, 0.42)",
    glow: "rgba(245, 158, 11, 0.22)",
    badge: "JA",
  },
  Claude: {
    accent: "#a78bfa",
    border: "rgba(167, 139, 250, 0.42)",
    glow: "rgba(139, 92, 246, 0.22)",
    badge: "CL",
  },
  Gemini: {
    accent: "#22d3ee",
    border: "rgba(34, 211, 238, 0.42)",
    glow: "rgba(14, 165, 233, 0.22)",
    badge: "GE",
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const isPricingSection = title === "Pricing";

  return (
    <section
      style={{
        marginTop: "66px",
        padding: isPricingSection ? 0 : "22px",
        borderRadius: isPricingSection ? undefined : "30px",
        background: isPricingSection
          ? undefined
          : "radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 42%), radial-gradient(circle at bottom right, rgba(34, 211, 238, 0.055), transparent 38%)",
      }}
    >
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={{ marginTop: "20px" }}>{children}</div>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "30px",
        padding: "0 12px",
        borderRadius: "999px",
        border: "1px solid rgba(165, 180, 252, 0.32)",
        background: "rgba(99, 102, 241, 0.13)",
        color: "#c4b5fd",
        fontSize: "12px",
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

export default function ToolDetailTemplate({ tool }: { tool: ToolProfile }) {
  const relatedTopics = getToolTopicSlugs(tool)
    .map((slug) => getTopicHub(slug))
    .filter((topic): topic is NonNullable<ReturnType<typeof getTopicHub>> => Boolean(topic))
    .slice(0, 5);
  const taggedRelatedArticles = getRelatedArticlesForTool(tool);
  const relatedArticles =
    taggedRelatedArticles.length > 0
      ? taggedRelatedArticles.map((article) => ({
          title: article.title,
          href: `/blog/${article.slug}`,
          category: article.category,
        }))
      : tool.relatedArticles;

  return (
    <main style={pageStyle}>
      <style>{`
        .tool-alternative-card {
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .tool-alternative-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-border) !important;
          box-shadow: 0 28px 72px rgba(2, 6, 23, 0.76), 0 0 38px var(--accent-glow) !important;
        }

        .tool-alternative-card:hover .tool-alternative-link {
          color: var(--accent) !important;
        }

        .tool-premium-card {
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .tool-premium-card:hover {
          transform: translateY(-3px);
          border-color: rgba(165, 180, 252, 0.44) !important;
          box-shadow: 0 28px 76px rgba(2, 6, 23, 0.72), 0 0 28px rgba(99, 102, 241, 0.14) !important;
        }
      `}</style>
      <div style={shellStyle}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: "22px" }}>
          <ol
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              margin: 0,
              padding: 0,
              listStyle: "none",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            {tool.breadcrumbs.map((crumb, index) => (
              <li key={crumb.href}>
                <a href={crumb.href} style={{ color: index === tool.breadcrumbs.length - 1 ? "#ffffff" : "#94a3b8", textDecoration: "none" }}>
                  {crumb.label}
                </a>
                {index < tool.breadcrumbs.length - 1 ? <span aria-hidden> / </span> : null}
              </li>
            ))}
          </ol>
        </nav>

        <section
          style={{
            ...cardStyle,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
            gap: "28px",
            padding: "clamp(24px, 5vw, 42px)",
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: "72px",
                height: "72px",
                borderRadius: "22px",
                background: "linear-gradient(135deg, #7c83ff, #22d3ee)",
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 900,
                boxShadow: "0 0 38px rgba(124, 131, 255, 0.42)",
              }}
            >
              {tool.logo}
            </div>
            <h1 style={{ margin: "22px 0 0", fontSize: "clamp(42px, 7vw, 74px)", lineHeight: 1.02 }}>
              {tool.name}
            </h1>
            <p style={{ ...mutedTextStyle, maxWidth: "720px", margin: "18px 0 0", fontSize: "18px" }}>
              {tool.tagline}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px" }}>
              {tool.categories.map((category) => (
                <Tag key={category}>{category}</Tag>
              ))}
            </div>
          </div>

          <aside
            style={{
              border: "1px solid rgba(148, 163, 184, 0.22)",
              borderRadius: "22px",
              padding: "22px",
              background: "rgba(2, 6, 23, 0.52)",
              alignSelf: "stretch",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#a5b4fc",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Pricing
            </p>
            <p style={{ margin: "10px 0 22px", color: "#ffffff", fontSize: "18px", lineHeight: 1.45 }}>
              {tool.pricingSummary}
            </p>

            <div style={{ display: "grid", gap: "16px", marginBottom: "22px" }}>
              <div>
                <h2
                  style={{
                    margin: "0 0 10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Pricing
                </h2>
                <div style={{ display: "grid", gap: "8px" }}>
                  {[
                    ["Free Plan", tool.actionCard.pricing.freePlan],
                    ["Starting Price", tool.actionCard.pricing.startingPrice],
                    ["Team Plan", tool.actionCard.pricing.teamPlan],
                    ["Enterprise Plan", tool.actionCard.pricing.enterprisePlan],
                    ["Pricing Verified", tool.actionCard.pricing.pricingVerified],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "14px",
                        borderRadius: "14px",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "10px 12px",
                        background: "rgba(15, 23, 42, 0.56)",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>{label}</span>
                      <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 800, textAlign: "right" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2
                  style={{
                    margin: "0 0 10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Platform
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                  {[
                    ["Web", tool.actionCard.platform.web],
                    ["iOS", tool.actionCard.platform.ios],
                    ["Android", tool.actionCard.platform.android],
                    ["API Access", tool.actionCard.platform.apiAccess],
                  ].map(([label, available]) => (
                    <div
                      key={label as string}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        borderRadius: "14px",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "10px 12px",
                        background: "rgba(15, 23, 42, 0.56)",
                      }}
                    >
                      <span style={{ color: "#cbd5e1", fontSize: "13px" }}>{label as string}</span>
                      <span
                        style={{
                          color: available ? "#34d399" : "#f87171",
                          fontSize: "12px",
                          fontWeight: 900,
                        }}
                      >
                        {available ? "Yes" : "No"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2
                  style={{
                    margin: "0 0 10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Quick Facts
                </h2>
                <div style={{ display: "grid", gap: "8px" }}>
                  {[
                    ["Company", tool.actionCard.quickFacts.company],
                    ["Founded", tool.actionCard.quickFacts.founded],
                    ["Best For", tool.actionCard.quickFacts.bestFor],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "32px 1fr",
                        gap: "10px",
                        alignItems: "center",
                        borderRadius: "14px",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "10px 12px",
                        background:
                          "radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 52%), rgba(15, 23, 42, 0.56)",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "11px",
                          border: "1px solid rgba(165, 180, 252, 0.32)",
                          background: "rgba(99, 102, 241, 0.16)",
                          color: "#c4b5fd",
                          fontSize: "10px",
                          fontWeight: 900,
                        }}
                      >
                        {quickFactIcons[label] ?? label.slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <span style={{ display: "block", color: "#94a3b8", fontSize: "12px" }}>{label}</span>
                        <span style={{ display: "block", marginTop: "4px", color: "#ffffff", fontSize: "13px", fontWeight: 800, lineHeight: 1.45 }}>
                          {value}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "46px",
                  borderRadius: "999px",
                  background: "linear-gradient(90deg, #6366f1, #a855f7)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Visit Website
              </a>
              <a
                href="#alternatives"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "46px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148, 163, 184, 0.34)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                View Alternatives
              </a>
            </div>
          </aside>
        </section>

        <Section title={`What is ${tool.name}?`}>
          <div className="tool-premium-card" style={{ ...cardStyle, padding: "28px", background: "radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 42%), rgba(11, 17, 32, 0.88)" }}>
            <p style={{ ...mutedTextStyle, margin: 0 }}>{tool.overview.intro}</p>
            <p style={{ ...mutedTextStyle, margin: "16px 0 0" }}>{tool.overview.targetUsers}</p>
            <p style={{ ...mutedTextStyle, margin: "16px 0 0" }}>{tool.overview.mainPurpose}</p>
            <ul style={{ display: "grid", gap: "10px", margin: "20px 0 0", paddingLeft: "20px", color: "#dbeafe" }}>
              {tool.overview.benefits.map((benefit) => (
                <li key={benefit} style={{ lineHeight: 1.6 }}>{benefit}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Key Features">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {tool.features.map((feature) => (
              <article key={feature.title} className="tool-premium-card" style={{ ...cardStyle, position: "relative", overflow: "hidden", padding: "22px" }}>
                <div aria-hidden style={{ position: "absolute", top: 0, left: "18px", right: "18px", height: "2px", background: "linear-gradient(90deg, #7c83ff, #22d3ee)", opacity: 0.7, boxShadow: "0 0 22px rgba(124, 131, 255, 0.55)" }} />
                <h3 style={{ margin: 0, fontSize: "19px" }}>{feature.title}</h3>
                <p style={{ ...mutedTextStyle, margin: "10px 0 0" }}>{feature.description}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Best For">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {tool.bestFor.map((userType) => (
              <Tag key={userType}>{userType}</Tag>
            ))}
          </div>
        </Section>

        <Section title="Use Cases">
          <div style={{ display: "grid", gap: "16px" }}>
            {tool.useCases.map((useCase) => (
              <article key={useCase.title} className="tool-premium-card" style={{ ...cardStyle, padding: "24px", background: "radial-gradient(circle at top right, rgba(34, 211, 238, 0.09), transparent 44%), rgba(11, 17, 32, 0.88)" }}>
                <h3 style={{ margin: 0, fontSize: "20px" }}>{useCase.title}</h3>
                <p style={{ ...mutedTextStyle, margin: "10px 0 0" }}>{useCase.description}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Pros & Cons">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {[
              ["Pros", tool.pros, "#34d399"],
              ["Cons", tool.cons, "#f59e0b"],
            ].map(([title, items, color]) => (
              <article key={title as string} className="tool-premium-card" style={{ ...cardStyle, padding: "24px", border: `1px solid ${title === "Pros" ? "rgba(52, 211, 153, 0.34)" : "rgba(245, 158, 11, 0.32)"}`, background: `radial-gradient(circle at top left, ${title === "Pros" ? "rgba(52, 211, 153, 0.12)" : "rgba(245, 158, 11, 0.1)"}, transparent 44%), rgba(11, 17, 32, 0.88)` }}>
                <h3 style={{ margin: 0, color: color as string }}>{title as string}</h3>
                <ul style={{ display: "grid", gap: "10px", margin: "16px 0 0", paddingLeft: "20px", color: "#cbd5e1" }}>
                  {(items as string[]).map((item) => (
                    <li key={item} style={{ lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Pricing">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {tool.pricing.map((plan) => (
              <article key={plan.plan} style={{ ...cardStyle, padding: "22px" }}>
                <h3 style={{ margin: 0, fontSize: "20px" }}>{plan.plan}</h3>
                <p style={{ margin: "12px 0", color: "#ffffff", fontSize: "22px", fontWeight: 900 }}>{plan.price}</p>
                <p style={{ ...mutedTextStyle, margin: 0 }}>{plan.details}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Screenshots Gallery">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {tool.screenshots.map((screenshot) => (
              <figure key={screenshot.title} className="tool-premium-card" style={{ ...cardStyle, margin: 0, overflow: "hidden" }}>
                <img src={screenshot.image} alt={screenshot.title} style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }} />
                <figcaption style={{ padding: "18px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>{screenshot.title}</h3>
                  <p style={{ ...mutedTextStyle, margin: "8px 0 0" }}>{screenshot.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section title="Alternatives">
          <div id="alternatives" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", scrollMarginTop: "80px" }}>
            {tool.alternatives.map((alternative) => {
              const accent = alternativeAccents[alternative.name] ?? {
                accent: "#a5b4fc",
                border: "rgba(165, 180, 252, 0.38)",
                glow: "rgba(99, 102, 241, 0.18)",
                badge: alternative.name.slice(0, 2).toUpperCase(),
              };

              return (
              <a
                key={alternative.href}
                href={alternative.href}
                className="tool-alternative-card"
                style={{
                  ...cardStyle,
                  "--accent": accent.accent,
                  "--accent-border": accent.border,
                  "--accent-glow": accent.glow,
                  position: "relative",
                  display: "block",
                  overflow: "hidden",
                  padding: "22px",
                  border: `1px solid ${accent.border}`,
                  background: `radial-gradient(circle at top right, ${accent.glow}, transparent 44%), rgba(11, 17, 32, 0.9)`,
                  color: "#ffffff",
                  textDecoration: "none",
                } as CSSProperties}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "18px",
                    right: "18px",
                    height: "2px",
                    borderRadius: "999px",
                    background: accent.accent,
                    boxShadow: `0 0 22px ${accent.accent}`,
                    opacity: 0.75,
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    display: "grid",
                    placeItems: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "13px",
                    border: `1px solid ${accent.border}`,
                    background: `radial-gradient(circle at top left, ${accent.glow}, rgba(15, 23, 42, 0.72))`,
                    color: accent.accent,
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  {accent.badge}
                </div>
                <h3 style={{ margin: 0, paddingRight: "48px", fontSize: "20px" }}>{alternative.name}</h3>
                <p style={{ ...mutedTextStyle, margin: "10px 0 0" }}>{alternative.description}</p>
                <span
                  className="tool-alternative-link"
                  style={{
                    display: "inline-flex",
                    marginTop: "18px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 900,
                    transition: "color 180ms ease",
                  }}
                >
                  View Tool →
                </span>
              </a>
              );
            })}
          </div>
        </Section>

        <Section title="FAQ">
          <div style={{ display: "grid", gap: "12px" }}>
            {tool.faqs.map((faq) => (
              <details key={faq.question} style={{ ...cardStyle, padding: "18px 20px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>{faq.question}</summary>
                <p style={{ ...mutedTextStyle, margin: "12px 0 0" }}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section title="Final Verdict">
          <div style={{ ...cardStyle, padding: "28px" }}>
            <p style={{ ...mutedTextStyle, margin: 0, fontSize: "16px" }}>{tool.verdict}</p>
          </div>
        </Section>

        {relatedTopics.length > 0 ? (
          <Section title="Related Topics">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {relatedTopics.map((topic) => (
                <a
                  key={topic.slug}
                  href={`/topics/${topic.slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: "38px",
                    padding: "0 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(165, 180, 252, 0.32)",
                    background: "rgba(99, 102, 241, 0.13)",
                    color: "#c4b5fd",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  {topic.title}
                </a>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Related Articles">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {relatedArticles.map((article) => (
              <a key={article.href} href={article.href} style={{ ...cardStyle, display: "block", padding: "22px", color: "#ffffff", textDecoration: "none" }}>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#a5b4fc",
                    fontSize: "11px",
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {article.category}
                </p>
                <h3 style={{ margin: 0, fontSize: "19px", lineHeight: 1.35 }}>{article.title}</h3>
              </a>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
