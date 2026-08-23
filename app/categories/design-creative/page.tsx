"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (Design & Creative)
const designToolGroups = {
  "Graphic & UI Design": [
    {
      name: "Canva",
      slug: "canva",
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
    {
      name: "Adobe Firefly",
      slug: "adobe-firefly",
      desc: "Generate images, text effects, and creative assets for Adobe design workflows.",
    },
    {
      name: "Krea",
      slug: "krea",
      desc: "Create, enhance, and iterate on AI images and visual concepts quickly.",
    },
    {
      name: "Recraft",
      slug: "recraft",
      desc: "Generate brand visuals, vector art, illustrations, icons, and marketing graphics.",
    },
    {
      name: "Freepik AI",
      slug: "freepik-ai",
      desc: "Create AI images, templates, mockups, and design assets from Freepik workflows.",
    },
    {
      name: "Adobe Express",
      slug: "adobe-express",
      desc: "Design social graphics, videos, templates, brand assets, and marketing content.",
    },
    {
      name: "VistaCreate",
      slug: "vistacreate",
      desc: "Create social media graphics, animations, brand visuals, and marketing templates.",
    },
    {
      name: "Creatopy",
      slug: "creatopy",
      desc: "Scale ad creatives, brand templates, campaign production, and design collaboration.",
    },
    {
      name: "Remove.bg",
      slug: "remove-bg",
      desc: "Remove image backgrounds for product photos, portraits, and ecommerce visuals.",
    },
    {
      name: "PhotoRoom",
      slug: "photoroom",
      desc: "Edit product photos, remove backgrounds, and create ecommerce visuals with AI.",
    },
    {
      name: "Pixlr",
      slug: "pixlr",
      desc: "Edit photos, create graphics, use templates, and apply AI visual tools online.",
    },
    {
      name: "Spline",
      slug: "spline",
      desc: "Create interactive 3D scenes, product visuals, and web design experiences.",
    },
    {
      name: "Framer",
      slug: "framer",
      desc: "Design and publish responsive websites, landing pages, CMS content, and interactions.",
    },
    {
      name: "LottieFiles",
      slug: "lottiefiles",
      desc: "Create, manage, preview, and share lightweight Lottie animations for products.",
    },
    {
      name: "Visme",
      slug: "visme",
      desc: "Create presentations, infographics, reports, social graphics, and branded visuals.",
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
    {
      name: "Kapwing",
      slug: "kapwing",
      desc: "Edit, subtitle, resize, and repurpose videos for social and marketing channels.",
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
