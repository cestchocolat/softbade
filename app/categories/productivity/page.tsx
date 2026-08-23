"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (Productivity)
const productivityToolGroups = {
  "Workspace & Docs": [
    { name: "Notion", slug: "notion", desc: "Organize documents, wikis, projects, and team knowledge in one flexible workspace." },
    { name: "Evernote", slug: "evernote", desc: "Capture notes, tasks, web clips, and research for searchable personal knowledge." },
    { name: "Mem", slug: "mem", desc: "Capture notes, search knowledge, and connect ideas with AI-powered organization." },
    { name: "Airtable", slug: "airtable", desc: "Organize data, workflows, automations, and lightweight team apps in flexible tables." },
    { name: "Coda", slug: "coda", desc: "Build collaborative docs, tables, automations, and team workflows in one workspace." },
    { name: "Slack", slug: "slack", desc: "Coordinate team conversations, channels, files, integrations, and workplace knowledge sharing." },
    { name: "Miro", slug: "miro", desc: "Collaborate on whiteboards, diagrams, workshops, planning, and visual team workflows." },
    { name: "Milanote", slug: "milanote", desc: "Plan creative projects with visual boards, notes, images, briefs, and research." },
  ],
  "Project Management": [
    { name: "ClickUp", slug: "clickup", desc: "Manage tasks, docs, goals, dashboards, and workflows for productive teams." },
    { name: "Monday.com", slug: "monday-com", desc: "Plan projects, automate work, and track team progress with visual dashboards." },
    { name: "Trello", slug: "trello", desc: "Visualize projects with simple Kanban boards for flexible task management." },
    { name: "Taskade", slug: "taskade", desc: "Manage tasks, mind maps, docs, AI workflows, and team collaboration." },
    { name: "Fellow", slug: "fellow", desc: "Run meetings with agendas, notes, action items, feedback, and follow-through." },
  ],
  "Tasks & Planning": [
    { name: "Todoist", slug: "todoist", desc: "Plan tasks, projects, and routines with lightweight personal productivity workflows." },
    { name: "Motion", slug: "motion", desc: "Plan tasks, calendars, projects, meetings, and focus time with AI scheduling." },
    { name: "Reclaim", slug: "reclaim", desc: "Automatically schedule tasks, habits, meetings, and focus time around your calendar." },
    { name: "Calendly", slug: "calendly", desc: "Automate scheduling links, availability, meeting routing, and team calendar workflows." },
    { name: "Sunsama", slug: "sunsama", desc: "Plan daily tasks, calendars, time blocks, and focused productivity routines." },
  ],
  "Writing & Focus": [
    { name: "Grammarly", slug: "grammarly", desc: "Improve writing clarity, grammar, tone, and productivity across business communication." },
    { name: "Otter", slug: "otter", desc: "Record, transcribe, summarize, and search meetings with AI meeting notes." },
    { name: "Fireflies.ai", slug: "fireflies-ai", desc: "Capture meeting recordings, transcripts, summaries, action items, and conversation insights." },
    { name: "Read AI", slug: "read-ai", desc: "Summarize meetings, capture transcripts, identify action items, and review meeting analytics." },
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
          Discover productivity tools that help teams work faster, stay organized,
          manage tasks, build workspaces, and improve focus.
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
      </section>
    </main>
  );
}
