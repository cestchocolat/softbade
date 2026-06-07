"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (Productivity)
const productivityToolGroups = {
  "Workspace & Docs": [
    { name: "Notion", slug: "notion", desc: "Organize documents, wikis, projects, and team knowledge in one flexible workspace." },
    { name: "Evernote", slug: "evernote", desc: "Capture notes, tasks, web clips, and research for searchable personal knowledge." },
  ],
  "Project Management": [
    { name: "ClickUp", slug: "clickup", desc: "Manage tasks, docs, goals, dashboards, and workflows for productive teams." },
    { name: "Monday.com", slug: "monday-com", desc: "Plan projects, automate work, and track team progress with visual dashboards." },
    { name: "Trello", slug: "trello", desc: "Visualize projects with simple Kanban boards for flexible task management." },
  ],
  "Tasks & Planning": [
    { name: "Todoist", slug: "todoist", desc: "Plan tasks, projects, and routines with lightweight personal productivity workflows." },
  ],
  "Writing & Focus": [
    { name: "Grammarly", slug: "grammarly", desc: "Improve writing clarity, grammar, tone, and productivity across business communication." },
  ],
} as const;

type TabKey = keyof typeof productivityToolGroups;

export default function ProductivityPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Workspace & Docs");
  const tools = productivityToolGroups[activeTab];

  return (
    <main className="landing">
      {/* HERO หมวด Productivity */}
      <section className="hero-full" style={{ marginTop: "10px" }}>
        <h1 className="hero-main">
          <span className="hero-main-highlight">Productivity</span>
        </h1>
        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          Tools ที่ช่วยให้ทำงานเร็วขึ้น จัดระบบได้ดีขึ้น และโฟกัสได้มากขึ้น —
          ตั้งแต่ workspace, task management ไปจนถึง writing assistants.
        </p>
      </section>

      {/* TABS + PANEL */}
      <section className="ai-section">
        <div className="ai-tabs-shell">
          <div className="ai-tabs">
            {Object.keys(productivityToolGroups).map((key) => {
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
                     {/*  <p className="ai-tool-slug">softbade.io/tools/{tool.slug}</p> */}
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
