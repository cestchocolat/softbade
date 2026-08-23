"use client";

import { useState } from "react";
import { toolProfiles } from "../../tools/toolData";

const aiToolSlugs = {
  "AI Writing": [
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
  ],
  "AI Image / Video": [
    "pictory",
    "fliki",
    "synthesia",
    "veed",
    "invideo",
    "wave-video",
    "descript",
    "simplified",
    "midjourney",
    "leonardo-ai",
    "ideogram",
    "runway",
    "heygen",
    "elevenlabs",
  ],
  Automation: [
    "albato",
    "pabbly",
    "zapier",
    "activepieces",
    "tallyfy",
    "n8n",
    "cursor",
    "windsurf",
    "github-copilot",
    "replit-ai",
    "codeium",
    "tabnine",
    "bolt",
    "v0",
  ],
  "AI Chatbots": [
    "botpress",
    "chatbase",
    "claude",
    "gemini",
    "perplexity",
    "poe",
    "character-ai",
    "huggingchat",
  ],
} as const;

function getToolsBySlugs(slugs: readonly string[]) {
  return slugs
  .map((slug) => toolProfiles.find((tool) => tool.slug === slug))
  .filter((tool): tool is (typeof toolProfiles)[number] => Boolean(tool))
  .map((tool) => ({
    name: tool.name,
    slug: tool.slug,
    desc: tool.tagline,
  }));
}

// ข้อมูล tools แยกตามหมวดย่อย
const aiToolGroups = {
  "AI Writing": getToolsBySlugs(aiToolSlugs["AI Writing"]),
  "AI Image / Video": getToolsBySlugs(aiToolSlugs["AI Image / Video"]),
  Automation: getToolsBySlugs(aiToolSlugs.Automation),
  "AI Chatbots": getToolsBySlugs(aiToolSlugs["AI Chatbots"]),
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
