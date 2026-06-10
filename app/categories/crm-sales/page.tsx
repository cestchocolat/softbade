"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (CRM & Sales)
const crmToolGroups = {
  "CRM (Pipeline & Deals)": [
    { name: "HubSpot", slug: "hubspot", desc: "Manage contacts, sales pipelines, marketing campaigns, and customer relationships at scale." },
    { name: "Pipedrive", slug: "pipedrive", desc: "Track sales pipelines, prioritize deals, and help teams close opportunities faster." },
    { name: "Zoho CRM", slug: "zoho-crm", desc: "Run sales, marketing, automation, and customer data inside an affordable CRM suite." },
    { name: "Freshsales", slug: "freshsales", desc: "Manage leads, automate follow-ups, and score prospects for modern sales teams." },
    { name: "Close CRM", slug: "close-crm", desc: "Accelerate outbound sales with built-in calling, email, and lead tracking." },
    { name: "Keap", slug: "keap", desc: "Combine CRM, email automation, and follow-up workflows for small businesses." },
  ],
  "Live Chat (Lead Capture)": [
    { name: "LiveChat", slug: "livechat", desc: "Convert website visitors into leads with real-time chat and support workflows." },
  ],
  "Chatbot (Sales-first)": [
    { name: "Tidio", slug: "tidio", desc: "Combine chatbots, live chat, and lead inboxes for ecommerce sales conversations." },
    { name: "ChatBot.com", slug: "chatbot-com", desc: "Create support and lead capture chatbots with templates and automation flows." },
  ],
} as const;

type TabKey = keyof typeof crmToolGroups;

export default function CRMSalesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("CRM (Pipeline & Deals)");
  const tools = crmToolGroups[activeTab];

  return (
    <main className="landing">
      {/* HERO หมวด CRM & Sales */}
      <section className="hero-full" style={{ marginTop: "10px" }}>
        <h1 className="hero-main">
          <span className="hero-main-highlight">CRM &amp; Sales</span>
        </h1>
        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          Explore CRM and sales tools for managing leads, tracking deals, closing
          opportunities, capturing prospects, and improving customer conversations.
        </p>
      </section>

      {/* TABS + PANEL */}
      <section className="ai-section">
        <div className="ai-tabs-shell">
          <div className="ai-tabs">
            {Object.keys(crmToolGroups).map((key) => {
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
                    </div>
                  </div>

                  <p className="ai-tool-desc">{tool.desc}</p>

                  <span className="ai-tool-link">Explore →</span>
                </a>
              ))}
            </div>
          </div>
      </section>
    </main>
  );
}
