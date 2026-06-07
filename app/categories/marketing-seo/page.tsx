"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (Marketing & SEO)
const marketingToolGroups = {
  "SEO Tools": [
    { name: "SurferSEO", slug: "surferseo", desc: "Optimize on-page SEO content with data-driven briefs, scoring, and keyword guidance." },
    { name: "Scalenut", slug: "scalenut", desc: "Plan, write, and optimize SEO content workflows for organic growth teams." },
    { name: "MarketMuse", slug: "marketmuse", desc: "Build content strategies with AI-driven topic modeling and competitive content insights." },
    { name: "Frase", slug: "frase", desc: "Create SEO briefs and optimized articles from SERP research and topic analysis." },
  ],
  "Social Media / Ads / Automation": [
    { name: "Publer", slug: "publer", desc: "Schedule, manage, and analyze social media posts across multiple platforms." },
    { name: "Ocoya", slug: "ocoya", desc: "Create social captions, visuals, and scheduled posts from one marketing workspace." },
    { name: "SocialBee", slug: "socialbee", desc: "Organize, recycle, and schedule social content for consistent audience engagement." },
    { name: "PromoRepublic", slug: "promorepublic", desc: "Manage social calendars, brand assets, and local marketing campaigns for teams." },
    { name: "Missinglettr", slug: "missinglettr", desc: "Turn blog posts into automated social campaigns for ongoing content promotion." },
    { name: "Sendible", slug: "sendible", desc: "Run agency social media management with publishing, collaboration, and analytics." },
  ],
  "Email Marketing": [
    { name: "GetResponse", slug: "getresponse", desc: "Build email campaigns, automation funnels, landing pages, and webinar workflows." },
    { name: "MailerLite", slug: "mailerlite", desc: "Create newsletters, automations, and landing pages for simple email marketing." },
    { name: "ConvertKit", slug: "convertkit", desc: "Grow creator audiences with email automation, segmentation, and digital product sales." },
    { name: "Systeme.io", slug: "systeme-io", desc: "Manage email marketing, funnels, courses, and automation from one platform." },
    { name: "ActiveCampaign", slug: "activecampaign", desc: "Automate customer journeys with email marketing, CRM, and lifecycle segmentation." },
  ],
} as const;

type TabKey = keyof typeof marketingToolGroups;

export default function MarketingSEOPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("SEO Tools");
  const tools = marketingToolGroups[activeTab];

  return (
    <main className="landing">
      {/* HERO หมวด Marketing & SEO */}
      <section className="hero-full" style={{ marginTop: "10px" }}>
        <h1 className="hero-main">
          <span className="hero-main-highlight">Marketing &amp; SEO</span>
        </h1>
        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          Explore marketing and SEO tools for content optimization, social media,
          automation, email campaigns, and sustainable business growth.
        </p>
      </section>

      {/* TABS + PANEL */}
      <section className="ai-section">
        <div className="ai-tabs-shell">
          <div className="ai-tabs">
            {Object.keys(marketingToolGroups).map((key) => {
              const tab = key as TabKey;
              return (
                <button
                  key={tab}
                  type="button"
                  className={`ai-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* กล่องด้านล่างที่เปลี่ยนตามแท็บ */}
          <div className="ai-panel">
            <h2 className="ai-panel-title">{activeTab}</h2>

            <div className="ai-tools-grid">
              {tools.map((tool) => (
                <a
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="ai-tool-card"
                >
                  <div className="ai-tool-header">
                    <div className="ai-tool-avatar">{tool.name.charAt(0)}</div>
                    <div>
                      <h3 className="ai-tool-name">{tool.name}</h3>
                      {/* <p className="ai-tool-slug">softbade.io/tools/{tool.slug}</p>*/}
                    </div>
                  </div>

                  <p className="ai-tool-desc">{tool.desc}</p>

                  <span className="ai-tool-link">Explore →</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
