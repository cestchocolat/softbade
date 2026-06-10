"use client";

import { useState } from "react";
import { toolProfiles } from "../../tools/toolData";

const aiWritingSlugs = [
  "jasper-ai",
  "justdone",
  "writesonic",
  "rytr",
  "anyword",
  "frase",
  "neuronwriter",
  "ink-for-all",
  "scalenut",
  "copysmith",
  "longshot",
];

const aiWritingTools = aiWritingSlugs
  .map((slug) => toolProfiles.find((tool) => tool.slug === slug))
  .filter((tool): tool is (typeof toolProfiles)[number] => Boolean(tool))
  .map((tool) => ({
    name: tool.name,
    slug: tool.slug,
    desc: tool.tagline,
  }));

// ข้อมูล tools แยกตามหมวดย่อย
const aiToolGroups = {
  "AI Writing": aiWritingTools,
  "AI Image / Video": [
    { name: "Pictory", slug: "pictory", desc: "Turn scripts and blog posts into shareable videos for content marketing workflows." },
    { name: "Fliki", slug: "fliki", desc: "Create short videos from text with AI voices for social content production." },
    { name: "Synthesia", slug: "synthesia", desc: "Produce presenter-led training and marketing videos with realistic AI avatars." },
    { name: "VEED", slug: "veed", desc: "Edit online videos, captions, and social clips for faster content publishing." },
    { name: "InVideo", slug: "invideo", desc: "Build branded videos from templates and AI prompts for marketing campaigns." },
    { name: "Wave.video", slug: "wave-video", desc: "Create, resize, and host videos for multi-channel social media campaigns." },
    { name: "Descript", slug: "descript", desc: "Edit video and audio by editing text for podcasts and tutorials." },
    { name: "Simplified", slug: "simplified", desc: "Manage AI design, video, and social content creation in one workspace." },
  ],
  Automation: [
    { name: "Albato", slug: "albato", desc: "Connect apps and automate workflows for operations, marketing, and sales teams." },
    { name: "Pabbly", slug: "pabbly", desc: "Automate app workflows, payments, and customer operations without complex setup." },
    { name: "ActivePieces", slug: "activepieces", desc: "Build open-source workflow automations for teams that need flexible integrations." },
    { name: "Tallyfy", slug: "tallyfy", desc: "Document, track, and automate repeatable business processes across teams efficiently." },
    { name: "n8n", slug: "n8n", desc: "Build advanced workflow automations with cloud or self-hosted developer flexibility." },
  ],
  "AI Chatbots": [
    { name: "Botpress", slug: "botpress", desc: "Build AI chatbots and automated conversation flows for customer support teams." },
    { name: "Chatbase", slug: "chatbase", desc: "Create website chatbots trained on your content for customer self-service." },
  ],
} as const;

type TabKey = keyof typeof aiToolGroups;

export default function AIAutomationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("AI Writing");
  const tools = aiToolGroups[activeTab];

  return (
    <main className="landing">
      {/* HERO หมวด AI & Automation */}
      <section className="hero-full" style={{ marginTop: "10px" }}>
        <h1 className="hero-main">
          <span className="hero-main-highlight">AI &amp; Automation</span>
        </h1>
        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          Explore curated AI and automation tools for content writing, video creation,
          workflow automation, chatbots, and modern productivity systems.
        </p>
      </section>

      {/* TABS + PANEL */}
      <section className="ai-section">
        <div className="ai-tabs-shell">
          <div className="ai-tabs">
            {Object.keys(aiToolGroups).map((key) => {
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
                     {/* <p className="ai-tool-slug">softbade.io/tools/{tool.slug}</p> */}
                    </div>
                  </div>

                  <p className="ai-tool-desc">{tool.desc}</p>

                  <span className="ai-tool-link">
                    Explore →
                  </span>
                </a>
              ))}
            </div>
          </div>
      </section>
    </main>
  );
}
