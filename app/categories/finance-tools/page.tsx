"use client";

import { useState } from "react";

// ข้อมูล tools แยกตามหมวดย่อย (Finance Tools)
const financeToolGroups = {
  "Accounting & Bookkeeping": [
    { name: "QuickBooks", slug: "quickbooks", desc: "Manage accounting, invoicing, expenses, payroll, and financial reporting for businesses." },
    { name: "FreshBooks", slug: "freshbooks", desc: "Create invoices, track expenses, and manage client payments for freelancers." },
    { name: "Xero", slug: "xero", desc: "Run cloud accounting, bank reconciliation, invoicing, and reporting for small businesses." },
    { name: "Sage Accounting", slug: "sage-accounting", desc: "Manage business accounting, compliance, reporting, and cash flow with structured tools." },
    { name: "Wave Accounting", slug: "wave-accounting", desc: "Handle simple accounting, invoicing, and receipts for small business owners." },
  ],
  "Payments & Transfers": [
    { name: "Payoneer", slug: "payoneer", desc: "Receive global payments and manage cross-border business payouts for freelancers." },
    { name: "Wise", slug: "wise", desc: "Send international transfers and manage multi-currency accounts for businesses." },
  ],
  "Expense Management": [
    { name: "Expensify", slug: "expensify", desc: "Track expenses, scan receipts, and automate reimbursement workflows for teams." },
  ],
} as const;

type TabKey = keyof typeof financeToolGroups;

export default function FinanceToolsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Accounting & Bookkeeping");
  const tools = financeToolGroups[activeTab];

  return (
    <main className="landing">
      {/* HERO หมวด Finance Tools */}
      <section className="hero-full" style={{ marginTop: "10px" }}>
        <h1 className="hero-main">
          <span className="hero-main-highlight">Finance Tools</span>
        </h1>
        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          เครื่องมือด้านการเงินสำหรับธุรกิจ — ตั้งแต่บัญชี, ใบแจ้งหนี้,
          จัดการค่าใช้จ่าย ไปจนถึงโอนเงิน/รับเงินต่างประเทศแบบมืออาชีพ.
        </p>
      </section>

      {/* TABS + PANEL */}
      <section className="ai-section">
        <div className="ai-tabs-shell">
          <div className="ai-tabs">
            {Object.keys(financeToolGroups).map((key) => {
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
