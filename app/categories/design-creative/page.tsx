"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (Design & Creative)
const designToolGroups = {
  "Graphic & UI Design": [
    {
      name: "Canva Pro",
      slug: "canva-pro",
      desc: "Create brand graphics, presentations, and marketing visuals for teams and creators.",
    },
    {
      name: "Figma",
      slug: "figma",
      desc: "Design interfaces, prototypes, and collaborative product workflows in real time.",
    },
    {
      name: "Envato Elements",
      slug: "envato-elements",
      desc: "Access design assets, templates, fonts, mockups, and creative resources by subscription.",
    },
    {
      name: "Placeit",
      slug: "placeit",
      desc: "Generate mockups, brand visuals, and video intros without advanced design skills.",
    },
  ],
  "Video & Motion": [
    {
      name: "Motion Array",
      slug: "motion-array",
      desc: "Download video templates, presets, stock assets, and motion graphics for production.",
    },
    {
      name: "Storyblocks",
      slug: "storyblocks",
      desc: "Find stock video, audio, and motion assets for creative production teams.",
    },
    {
      name: "VEED",
      slug: "veed",
      desc: "Edit online videos, captions, and social clips for faster content publishing.",
    },
    {
      name: "Descript",
      slug: "descript",
      desc: "Edit video and audio by editing text for podcasts and tutorials.",
    },
  ],
} as const;

type TabKey = keyof typeof designToolGroups;

export default function DesignCreativePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Graphic & UI Design");
  const tools = designToolGroups[activeTab];

  return (
    <main className="landing">
      {/* HERO หมวด Design & Creative */}
      <section className="hero-full" style={{ marginTop: "10px" }}>
        <h1 className="hero-main">
          <span className="hero-main-highlight">Design &amp; Creative</span>
        </h1>
        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          Explore design and creative tools for graphics, UI/UX, mockups, motion
          assets, video editing, and creator workflows.
        </p>
      </section>

      {/* TABS + PANEL */}
      <section className="ai-section">
        <div className="ai-tabs-shell">
          <div className="ai-tabs">
            {Object.keys(designToolGroups).map((key) => {
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
                    <div className="ai-tool-avatar">
                      {tool.name.charAt(0)}
                    </div>
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
