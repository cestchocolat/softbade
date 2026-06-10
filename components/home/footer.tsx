const footerColumns = [
  {
    title: "Explore",
    links: [
      ["Categories", "/categories"],
      ["Blog", "/blog"],
      ["About", "/about"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Categories",
    links: [
      ["AI & Automation", "/categories/ai-automation"],
      ["Marketing & SEO", "/categories/marketing-seo"],
      ["Productivity", "/categories/productivity"],
      ["CRM & Sales", "/categories/crm-sales"],
      ["Design & Creative", "/categories/design-creative"],
      ["Finance Tools", "/categories/finance-tools"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Tool Guides", "/blog/tool-roundups"],
      ["Workflow Ideas", "/blog/workflow-ideas"],
      ["Software Discovery", "/tools"],
    ],
  },
];

const linkStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
  lineHeight: 1.45,
  textDecoration: "none",
} as const;

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "42px 24px 28px",
        borderTop: "1px solid rgba(148, 163, 184, 0.22)",
        background:
          "linear-gradient(180deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 1))",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "28px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#ffffff", fontSize: "24px" }}>
              Softbade
            </h2>
            <p
              style={{
                maxWidth: "360px",
                margin: "14px 0 0",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.72,
              }}
            >
              Discover curated AI and SaaS tools for smarter work, automation,
              productivity, marketing, CRM, design, and finance.
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {column.title}
              </h3>
              <ul
                style={{
                  display: "grid",
                  gap: "10px",
                  margin: "16px 0 0",
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <a href={href} style={linkStyle}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Company
            </h3>
            <ul
              style={{
                display: "grid",
                gap: "10px",
                margin: "16px 0 0",
                padding: 0,
                listStyle: "none",
              }}
            >
              {[
                ["About", "/about"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} style={linkStyle}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <p style={{ margin: "16px 0 0", color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
              <a href="mailto:contact@softbade.com" style={{ ...linkStyle, color: "#94a3b8", fontSize: "13px" }}>
                contact@softbade.com
              </a>
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "34px",
            padding: "20px 0 0",
            borderTop: "1px solid rgba(148, 163, 184, 0.16)",
            color: "#94a3b8",
            fontSize: "13px",
          }}
        >
          © 2026 Softbade. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
