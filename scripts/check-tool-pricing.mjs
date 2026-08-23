#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import vm from "node:vm";
import { google } from "googleapis";
import { chromium } from "playwright";
import ts from "typescript";

const TOOLS = {
  "jasper-ai": { name: "Jasper AI", sourceUrl: "https://www.jasper.ai/pricing" },
  chatgpt: { name: "ChatGPT", sourceUrl: "https://chatgpt.com/pricing" },
  claude: { name: "Claude", sourceUrl: "https://claude.com/pricing" },
  notion: { name: "Notion", sourceUrl: "https://www.notion.com/pricing" },
  canva: { name: "Canva", sourceUrl: "https://www.canva.com/pricing/" },
  hubspot: { name: "HubSpot", sourceUrl: "https://www.hubspot.com/pricing" },
};
const SECONDARY_SOURCE_CONFIG = {
  chatgpt: {
    trustedDomains: ["chatgpt.com", "openai.com", "help.openai.com"],
    sources: [
      "https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus",
      "https://openai.com/index/introducing-chatgpt-go/",
    ],
  },
};
const MODEL = "gpt-5.6-luna";
const MAX_PAGE_TEXT_CHARS = 45000;
const MIN_READABLE_TEXT_CHARS = 200;
const REPORTS_DIR = "reports";
const SHEET_CONFIG_PATH = path.join(REPORTS_DIR, "softbade-pricing-sheet.json");
const SPREADSHEET_TITLE = "Softbade Pricing Audit";
const SUMMARY_TAB = "Summary";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const FIELD_LABELS = {
  freePlan: "Free Plan",
  startingPrice: "Starting Price",
  annualBilling: "Annual Billing",
  monthlyBilling: "Monthly Billing",
  teamPlan: "Team / Business Plan",
  enterprisePlan: "Enterprise Plan",
};

const COMPARED_FIELDS = ["freePlan", "startingPrice", "annualBilling", "monthlyBilling", "teamPlan", "enterprisePlan"];
const REQUIRED_CURRENT_FIELDS = ["freePlan", "startingPrice", "teamPlan", "enterprisePlan", "pricingVerified"];

const OPENAI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    freePlan: { type: ["string", "null"] },
    startingPrice: { type: ["string", "null"] },
    annualBilling: { type: ["string", "null"] },
    monthlyBilling: { type: ["string", "null"] },
    teamPlan: { type: ["string", "null"] },
    enterprisePlan: { type: ["string", "null"] },
    localeSpecific: { type: "boolean" },
    localeEvidence: { type: ["string", "null"] },
    noPricingPublished: { type: "boolean" },
    noPricingPublishedEvidence: { type: ["string", "null"] },
    fullPricingPlans: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          plan: { type: "string" },
          price: { type: ["string", "null"] },
          details: { type: ["string", "null"] },
          evidence: { type: ["string", "null"] },
        },
        required: ["plan", "price", "details", "evidence"],
      },
    },
    fieldAmbiguity: {
      type: "object",
      additionalProperties: false,
      properties: {
        freePlan: { type: "boolean" },
        startingPrice: { type: "boolean" },
        annualBilling: { type: "boolean" },
        monthlyBilling: { type: "boolean" },
        teamPlan: { type: "boolean" },
        enterprisePlan: { type: "boolean" },
      },
      required: ["freePlan", "startingPrice", "annualBilling", "monthlyBilling", "teamPlan", "enterprisePlan"],
    },
    ambiguityEvidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        freePlan: { type: ["string", "null"] },
        startingPrice: { type: ["string", "null"] },
        annualBilling: { type: ["string", "null"] },
        monthlyBilling: { type: ["string", "null"] },
        teamPlan: { type: ["string", "null"] },
        enterprisePlan: { type: ["string", "null"] },
      },
      required: ["freePlan", "startingPrice", "annualBilling", "monthlyBilling", "teamPlan", "enterprisePlan"],
    },
    evidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        freePlan: { type: ["string", "null"] },
        startingPrice: { type: ["string", "null"] },
        annualBilling: { type: ["string", "null"] },
        monthlyBilling: { type: ["string", "null"] },
        teamPlan: { type: ["string", "null"] },
        enterprisePlan: { type: ["string", "null"] },
      },
      required: ["freePlan", "startingPrice", "annualBilling", "monthlyBilling", "teamPlan", "enterprisePlan"],
    },
  },
  required: [
    "freePlan",
    "startingPrice",
    "annualBilling",
    "monthlyBilling",
    "teamPlan",
    "enterprisePlan",
    "localeSpecific",
    "localeEvidence",
    "noPricingPublished",
    "noPricingPublishedEvidence",
    "fullPricingPlans",
    "fieldAmbiguity",
    "ambiguityEvidence",
    "evidence",
  ],
};

function usage() {
  console.error(`Usage:
  node scripts/check-tool-pricing.mjs <${Object.keys(TOOLS).join("|")}> [--apply]
  node scripts/check-tool-pricing.mjs --all [--limit N] [--sheet]
  node scripts/check-tool-pricing.mjs --pricing-eligibility-all [--limit N]`);
}

function fail(message, error) {
  console.error(`ERROR: ${message}`);
  if (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function findMatchingBracket(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function extractObjectContaining(source, needle) {
  const needleIndex = source.indexOf(needle);
  if (needleIndex === -1) {
    throw new Error(`Could not locate ${needle}`);
  }

  const openIndex = source.lastIndexOf("{", needleIndex);
  if (openIndex === -1) {
    throw new Error(`Could not find object start before ${needle}`);
  }

  const closeIndex = findMatchingBrace(source, openIndex);
  if (closeIndex === -1) {
    throw new Error(`Could not find object end for ${needle}`);
  }

  return source.slice(openIndex, closeIndex + 1);
}

function extractProfileSource(source, slug) {
  const slugNeedle = `slug: "${slug}"`;
  const slugIndex = source.indexOf(slugNeedle);
  if (slugIndex === -1) {
    throw new Error(`Could not locate ${slugNeedle}`);
  }

  const objectSource = extractObjectContaining(source, slugNeedle);
  const beforeObject = source.slice(0, source.lastIndexOf("{", slugIndex));
  const profileType = /\bcreate[A-Za-z]+Profile\s*\(\s*$/.test(beforeObject.slice(-80))
    ? "helper-generated profile call"
    : "explicit profile object";

  return { profileType, objectSource };
}

function extractProfileRange(source, slug) {
  const slugNeedle = `slug: "${slug}"`;
  const slugIndex = source.indexOf(slugNeedle);
  if (slugIndex === -1 || source.indexOf(slugNeedle, slugIndex + slugNeedle.length) !== -1) {
    throw new Error(`Could not uniquely locate ${slugNeedle}`);
  }

  const openIndex = source.lastIndexOf("{", slugIndex);
  if (openIndex === -1) {
    throw new Error(`Could not find object start before ${slugNeedle}`);
  }

  const closeIndex = findMatchingBrace(source, openIndex);
  if (closeIndex === -1) {
    throw new Error(`Could not find object end for ${slugNeedle}`);
  }

  const beforeObject = source.slice(0, source.lastIndexOf("{", slugIndex));
  const profileType = /\bcreate[A-Za-z]+Profile\s*\(\s*$/.test(beforeObject.slice(-80))
    ? "helper-generated profile call"
    : "explicit profile object";

  return {
    profileType,
    start: openIndex,
    end: closeIndex + 1,
    objectSource: source.slice(openIndex, closeIndex + 1),
  };
}

function readStringField(source, fieldName) {
  const pattern = new RegExp(`${fieldName}\\s*:\\s*([\"'\`])([\\s\\S]*?)\\1`);
  const match = source.match(pattern);
  return match ? match[2] : null;
}

function findTopLevelPricingArray(objectSource) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  const matches = [];

  for (let index = 0; index < objectSource.length; index += 1) {
    const char = objectSource[index];
    const next = objectSource[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      continue;
    }

    if (depth !== 1 || !objectSource.startsWith("pricing", index)) continue;
    const before = objectSource[index - 1] ?? "";
    const after = objectSource[index + "pricing".length] ?? "";
    if (/[A-Za-z0-9_$]/.test(before) || /[A-Za-z0-9_$]/.test(after)) continue;

    let cursor = index + "pricing".length;
    while (/\s/.test(objectSource[cursor] ?? "")) cursor += 1;
    if (objectSource[cursor] !== ":") continue;
    cursor += 1;
    while (/\s/.test(objectSource[cursor] ?? "")) cursor += 1;
    if (objectSource[cursor] !== "[") continue;

    const arrayEnd = findMatchingBracket(objectSource, cursor);
    if (arrayEnd === -1) {
      throw new Error("Could not find end of top-level pricing[] array");
    }
    matches.push({ start: cursor, end: arrayEnd + 1 });
  }

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one top-level pricing[] array, found ${matches.length}`);
  }

  return matches[0];
}

function quoteTsString(value) {
  return JSON.stringify(String(value));
}

function formatPricingArray(plans, baseIndent) {
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error("Generated pricing[] replacement is empty");
  }

  const itemIndent = `${baseIndent}  `;
  const propertyIndent = `${baseIndent}    `;
  const entries = plans.map((plan) => {
    if (!usefulText(plan.plan) || !usefulText(plan.price)) {
      throw new Error("Generated pricing[] replacement contains invalid plan or price");
    }
    return [
      `${itemIndent}{`,
      `${propertyIndent}plan: ${quoteTsString(plan.plan)},`,
      `${propertyIndent}price: ${quoteTsString(plan.price)},`,
      `${propertyIndent}details: ${quoteTsString(plan.details ?? "")},`,
      `${itemIndent}},`,
    ].join("\n");
  });

  const source = ["[", ...entries, `${baseIndent}]`].join("\n");
  validatePricingArraySource(source);
  return source;
}

function validatePricingArraySource(source) {
  if (/\bpricing\s*:\s*\{/.test(source) || /\bpricing\s*:\s*(plan|price|details)\s*:/.test(source)) {
    throw new Error("Generated pricing[] replacement has malformed nested pricing properties");
  }
  if (!/^\[\n\s+\{\n\s+plan: /.test(source)) {
    throw new Error("Generated pricing[] replacement does not start with a plain plan object");
  }
}

function validatePricingSerializer() {
  const source = formatPricingArray([
    {
      plan: "Pro",
      price: "$59/month per seat billed yearly or $69/month per seat billed monthly",
      details: "Powerful AI for staying on-brand, with 1 seat and core marketing workflows.",
    },
    {
      plan: "Business",
      price: "Custom pricing",
      details: "AI platform for elevating brands and accelerating team impact; includes additional workflows, collaboration, API access, and enterprise-grade governance.",
    },
  ], "    ");

  if (!/^\[\n\s+\{\n\s+plan: "Pro",\n\s+price: /.test(source)) {
    throw new Error("Generated pricing[] replacement failed serializer self-check");
  }

  for (const malformedSource of [
    "[\n  pricing: {\n  },\n]",
    "[\n  {\n    pricing: plan: \"Pro\",\n  },\n]",
    "[\n  {\n    pricing: price: \"$59/month\",\n  },\n]",
    "[\n  {\n    pricing: details: \"Details\",\n  },\n]",
  ]) {
    try {
      validatePricingArraySource(malformedSource);
    } catch {
      continue;
    }
    throw new Error("Generated pricing[] replacement failed malformed-output self-check");
  }
}

async function replaceToolPricingArray(slug, proposedPlans) {
  const toolDataPath = path.join(process.cwd(), "app", "tools", "toolData.ts");
  const source = await fs.readFile(toolDataPath, "utf8");
  const profileRange = extractProfileRange(source, slug);
  const pricingRange = findTopLevelPricingArray(profileRange.objectSource);
  const absoluteStart = profileRange.start + pricingRange.start;
  const absoluteEnd = profileRange.start + pricingRange.end;
  const lineStart = source.lastIndexOf("\n", absoluteStart) + 1;
  const pricingPrefix = source.slice(lineStart, absoluteStart);
  const baseIndent = pricingPrefix.match(/^\s*/)?.[0] ?? "";
  const replacement = formatPricingArray(proposedPlans, baseIndent);

  const updated = `${source.slice(0, absoluteStart)}${replacement}${source.slice(absoluteEnd)}`;
  if (updated === source) {
    throw new Error("Generated pricing[] replacement did not change the source");
  }

  await fs.writeFile(toolDataPath, updated, "utf8");
}

async function readCurrentPricing(slug) {
  const toolDataPath = path.join(process.cwd(), "app", "tools", "toolData.ts");
  const source = await fs.readFile(toolDataPath, "utf8");
  const { profileType, objectSource } = extractProfileSource(source, slug);
  const pricingObject = profileType === "helper-generated profile call"
    ? extractObjectContaining(objectSource, "pricing:")
    : extractObjectContaining(extractObjectContaining(objectSource, "actionCard:"), "pricing:");

  const current = {
    freePlan: readStringField(pricingObject, "freePlan"),
    startingPrice: readStringField(pricingObject, "startingPrice"),
    annualBilling: readStringField(pricingObject, "annualBilling"),
    monthlyBilling: readStringField(pricingObject, "monthlyBilling"),
    teamPlan: readStringField(pricingObject, "teamPlan"),
    enterprisePlan: readStringField(pricingObject, "enterprisePlan"),
    pricingVerified: readStringField(pricingObject, "pricingVerified"),
    profileType,
  };

  for (const field of REQUIRED_CURRENT_FIELDS) {
    const value = current[field];
    if (value === null) {
      throw new Error(`Could not parse current ${slug} pricing.${field}`);
    }
  }

  return current;
}

async function loadToolProfiles() {
  const toolDataPath = path.join(process.cwd(), "app", "tools", "toolData.ts");
  const source = await fs.readFile(toolDataPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    console,
  };

  vm.runInNewContext(transpiled, sandbox, {
    filename: toolDataPath,
    timeout: 5000,
  });

  if (!Array.isArray(module.exports.toolProfiles)) {
    throw new Error("Could not load exported toolProfiles from app/tools/toolData.ts");
  }

  return module.exports.toolProfiles;
}

function currentPricingFromProfile(profile) {
  const pricing = profile.actionCard?.pricing ?? {};
  return {
    freePlan: pricing.freePlan ?? null,
    startingPrice: pricing.startingPrice ?? null,
    annualBilling: pricing.annualBilling ?? null,
    monthlyBilling: pricing.monthlyBilling ?? null,
    teamPlan: pricing.teamPlan ?? null,
    enterprisePlan: pricing.enterprisePlan ?? null,
    pricingVerified: pricing.pricingVerified ?? null,
    profileType: "evaluated tool profile",
  };
}

async function loadToolProfile(slug) {
  const profiles = await loadToolProfiles();
  const profile = profiles.find((tool) => tool.slug === slug);
  if (!profile) {
    throw new Error(`Could not load ToolProfile for slug "${slug}"`);
  }
  return profile;
}

async function fetchHtmlForDiscovery(sourceUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "SoftbadePricingChecker/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) return null;

    return { html: await response.text(), finalUrl: response.url };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function sameHostname(url, baseUrl) {
  try {
    return new URL(url).hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}

function equivalentHostname(url, baseUrl) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const baseHostname = new URL(baseUrl).hostname.replace(/^www\./, "");
    return hostname === baseHostname;
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function pricingSignal(value) {
  return /\b(pricing|plans|packages)\b/i.test(value);
}

function identityText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactIdentityText(value) {
  return identityText(value).replace(/\s+/g, "");
}

function productIdentityTokens(profile) {
  const stopWords = new Set(["ai", "app", "apps", "pro", "for", "all", "the", "and", "tool", "tools", "software"]);
  const values = [profile.name, profile.slug, profile.actionCard?.company].filter(Boolean);
  return unique(values.flatMap((value) =>
    identityText(value)
      .split(" ")
      .filter((token) => token.length >= 4 && !stopWords.has(token))
  ));
}

function sourceMatchesProductIdentity(profile, candidateUrl, finalUrl, pageText) {
  const sameFinalHost = equivalentHostname(candidateUrl, finalUrl);
  const sourceText = sameFinalHost
    ? `${candidateUrl} ${finalUrl} ${pageText}`
    : `${finalUrl} ${pageText}`;
  const haystack = identityText(sourceText);
  const compactHaystack = compactIdentityText(sourceText);
  const exactName = identityText(profile.name);
  const compactName = compactIdentityText(profile.name);
  if (exactName && haystack.includes(exactName)) return true;
  if (compactName && compactName.length >= 5 && compactHaystack.includes(compactName)) return true;

  const tokens = productIdentityTokens(profile);
  return tokens.length > 0 && tokens.some((token) => haystack.includes(token));
}

function extractPricingLinks(html, baseUrl) {
  const links = [];
  const anchorPattern = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const href = match[2];
    const text = cleanHtmlToText(match[3]);
    let candidate;

    try {
      candidate = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }

    if (!sameHostname(candidate, baseUrl)) continue;
    if (!pricingSignal(candidate) && !pricingSignal(text)) continue;
    if (/\b(blog|article|news|affiliate|review)\b/i.test(candidate)) continue;

    links.push(candidate);
  }

  return unique(links);
}

async function candidateLooksLikePricing(profile, candidateUrl) {
  const fetched = await fetchHtmlForDiscovery(candidateUrl);
  if (!fetched) return null;

  const text = cleanHtmlToText(fetched.html);
  if (text.length < MIN_READABLE_TEXT_CHARS) return null;
  if (!sourceMatchesProductIdentity(profile, candidateUrl, fetched.finalUrl, text)) {
    return {
      rejected: true,
      sourceUrl: candidateUrl,
      finalUrl: fetched.finalUrl,
      reason: `Pricing source identity could not be verified for ${profile.name}.`,
    };
  }

  return { sourceUrl: candidateUrl, finalUrl: fetched.finalUrl };
}

async function discoverPricingSource(profile) {
  if (TOOLS[profile.slug]) {
    return {
      sourceStatus: "LOCKED",
      requestedSourceUrl: TOOLS[profile.slug].sourceUrl,
      finalSourceUrl: null,
      note: "Locked official pricing source.",
    };
  }

  if (!profile.websiteUrl) {
    return {
      sourceStatus: "SOURCE_MISSING",
      requestedSourceUrl: null,
      finalSourceUrl: null,
      note: "Softbade profile has no website URL.",
    };
  }

  let website;
  try {
    website = new URL(profile.websiteUrl);
  } catch {
    return {
      sourceStatus: "SOURCE_MISSING",
      requestedSourceUrl: null,
      finalSourceUrl: null,
      note: `Invalid website URL: ${profile.websiteUrl}`,
    };
  }

  const candidates = [];
  const homepage = await fetchHtmlForDiscovery(website.toString());
  if (homepage) {
    candidates.push(...extractPricingLinks(homepage.html, homepage.finalUrl));
  }

  candidates.push(
    new URL("/pricing", website.origin).toString(),
    new URL("/pricing/", website.origin).toString(),
    new URL("/plans", website.origin).toString(),
    new URL("/plans/", website.origin).toString(),
  );

  const rejectedCandidates = [];
  for (const candidate of unique(candidates)) {
    const result = await candidateLooksLikePricing(profile, candidate);
    if (result?.rejected) {
      rejectedCandidates.push(result);
      continue;
    }
    if (result) {
      return {
        sourceStatus: "DISCOVERED",
        requestedSourceUrl: result.sourceUrl,
        finalSourceUrl: result.finalUrl,
        note: "Discovered same-domain official pricing source.",
      };
    }
  }

  return {
    sourceStatus: "SOURCE_MISSING",
    requestedSourceUrl: null,
    finalSourceUrl: null,
    note: rejectedCandidates.length > 0
      ? `No valid pricing source with verified product identity was safely discovered. Rejected ${rejectedCandidates.length} candidate(s); first rejected source: ${rejectedCandidates[0].finalUrl}. ${rejectedCandidates[0].reason}`
      : "No same-domain official pricing/plans/packages page was safely discovered.",
  };
}

function cleanHtmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|header|footer|main|li|ul|ol|table|tr|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PAGE_TEXT_CHARS);
}

async function fetchPricingPage(sourceUrl) {
  let httpFinalUrl = sourceUrl;
  let httpError = null;

  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        "user-agent": "SoftbadePricingChecker/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });
    httpFinalUrl = response.url;

    if (!response.ok) {
      throw new Error(`Official pricing page returned HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const text = cleanHtmlToText(html);
    if (text.length >= MIN_READABLE_TEXT_CHARS) {
      return { text, finalUrl: response.url, fetchStatus: "OK", fetchMethod: "HTTP", errorMessage: null };
    }

    httpError = new Error("HTTP fetch returned too little readable pricing content.");
  } catch (error) {
    httpError = error;
  }

  return fetchPricingPageWithPlaywright(sourceUrl, httpFinalUrl, httpError);
}

async function fetchPricingPageWithPlaywright(sourceUrl, lastKnownFinalUrl, priorError) {
  let browser;
  let context;
  let page;
  let finalUrl = lastKnownFinalUrl || sourceUrl;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);

    finalUrl = page.url();
    const bodyText = await page.locator("body").innerText({ timeout: 10000 });
    const text = bodyText.replace(/\s+/g, " ").trim().slice(0, MAX_PAGE_TEXT_CHARS);

    if (text.length >= MIN_READABLE_TEXT_CHARS) {
      return { text, finalUrl, fetchStatus: "OK", fetchMethod: "PLAYWRIGHT", errorMessage: null };
    }

    return {
      text,
      finalUrl,
      fetchStatus: "ERROR",
      fetchMethod: "PLAYWRIGHT",
      errorMessage: "Playwright rendered page returned too little readable pricing content.",
    };
  } catch (error) {
    return {
      text: "",
      finalUrl,
      fetchStatus: "ERROR",
      fetchMethod: "PLAYWRIGHT",
      errorMessage: priorError
        ? `${priorError instanceof Error ? priorError.message : String(priorError)} Playwright fallback failed: ${error instanceof Error ? error.message : String(error)}`
        : `Playwright fallback failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await page?.close().catch(() => {});
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}

function buildExtractionPrompt(tool, pageText, requestedSourceUrl, finalSourceUrl) {
  return [
    {
      role: "system",
      content:
        "You extract pricing facts from supplied official page text. Use only the supplied text. Never use memory. Never guess. Return only valid JSON matching the schema.",
    },
    {
      role: "user",
      content: `Official ${tool.name} pricing page text follows.

Requested source URL: ${requestedSourceUrl}
Final source URL after redirects: ${finalSourceUrl}

Extraction rules:
- Use ONLY information contained in this supplied official ${tool.name} pricing page text.
- Never use model memory.
- Never guess.
- Never infer that one plan is equivalent to another plan.
- Do NOT automatically map "Business" to "Enterprise Plan".
- Do NOT automatically map "Pro" to "Starting Price" unless it is clearly the standard paid entry plan.
- If the official page does not explicitly support a Softbade field, return null for that field.
- freePlan is semantic and must be exactly "Yes", "No", or null.
- Return freePlan "Yes" ONLY if an ongoing free plan is explicitly offered.
- Return freePlan "No" ONLY if the official source explicitly establishes there is no ongoing free plan.
- Return freePlan null if neither Yes nor No can be explicitly established.
- A free trial is NOT the same as a Free Plan.
- Do not put descriptive free-plan pricing such as "$0 per member / month" in freePlan; use that only as evidence for "Yes" when appropriate.
- Contact sales or custom pricing must be explicitly supported.
- Preserve billing context such as per month, per seat, monthly billing, annual billing, or custom pricing where relevant.
- Do not put Free-plan pricing into startingPrice.
- startingPrice is only for the standard paid entry plan.
- For startingPrice, preserve all explicitly stated standard entry pricing variants when they materially affect billing context.
- If both monthly billing and annual-billing prices are explicitly stated for the standard entry plan, include both in startingPrice.
- For startingPrice, preserve amount, currency, billing period, per-seat or per-user context, and monthly vs annual billing context.
- Do not choose only the cheapest price when multiple official standard entry billing options are explicitly provided.
- Do not include unrelated higher-tier plans in startingPrice.
- annualBilling and monthlyBilling should be non-null only when the supplied page explicitly states annual-billing or monthly-billing variants for the standard entry paid plan.
- Do not infer a missing annual price from a monthly price or vice versa.
- Do NOT treat an English (US) language selector, "Price in USD", prices displayed in USD, or a generic locale/language selector as locale-specific by itself.
- If the requested source URL and final source URL are the same generic official pricing URL, English (US) or USD alone MUST NOT trigger localeSpecific.
- Set localeSpecific to true ONLY with concrete evidence that fetched pricing is region-dependent, such as a redirect to a country-specific pricing path that may affect currency/pricing, explicit page text saying displayed pricing is country/region-specific, currency/pricing changed because of detected geography, or another clear regional-pricing indicator.
- Do not normalize, convert, or assume currencies.
- Evaluate ambiguity independently for each Softbade field. Do NOT mark every field ambiguous merely because the page contains multiple plans, products, sections, or API pricing.
- A field is not ambiguous when headings, plan names, and surrounding official pricing context provide a clear explicit match for that field.
- An explicitly named ongoing "Free" plan may verify freePlan even if other pricing sections exist elsewhere on the page.
- teamPlan semantically means the standard Team or Business tier intended for multi-user, collaborative, company, or organizational use before or distinct from Enterprise.
- An explicitly named "Team" or "Teams" plan may verify teamPlan when it clearly fits that standard multi-user or organizational tier.
- An explicitly named "Business" plan may verify teamPlan ONLY when official evidence clearly shows it is a standard multi-user, collaborative, company, or organizational tier and is distinct from Enterprise when Enterprise also exists.
- Do NOT blindly map "Business" to teamPlan. If Business is custom-only, enterprise-like, unclear in scope, the only enterprise-like organizational plan, or ambiguous relative to Enterprise, return null for teamPlan and set fieldAmbiguity.teamPlan true with an explanation.
- An explicitly named "Enterprise" plan may verify enterprisePlan even if API pricing exists elsewhere on the page.
- Never put an explicit Enterprise plan into teamPlan.
- A clearly identified standard paid entry plan in an individual-user pricing section may verify startingPrice.
- Explicit monthly and annual prices for that same standard paid entry plan may verify monthlyBilling and annualBilling.
- Set fieldAmbiguity.<field> to true only when that specific field is ambiguous.
- If a specific field is ambiguous, return null for that field and explain in ambiguityEvidence.<field>.
- Example: if a page contains separate Marketing, Sales, and Service product pricing and the Softbade profile has one generic startingPrice with no reliable way to determine which product it represents, startingPrice is ambiguous and should be null/REVIEW.
- Set noPricingPublished to true only if the supplied official page explicitly states that pricing is not published, pricing must be requested, or pricing requires contacting sales with no public price details.
- If noPricingPublished is true, explain in noPricingPublishedEvidence.
- Prefer current pricing, billing, help, or documentation text over older announcement text. If announcement pricing may be outdated or currentness cannot be confirmed from the supplied page text, mark the affected field ambiguous/null rather than auto-verifying it.
- Each non-null extracted value must have short evidence taken from the supplied page content.
- If evidence is insufficient, the value must be null.
- Also extract fullPricingPlans as a read-only preview of the complete official pricing-plan structure from this supplied source.
- fullPricingPlans must reuse the existing Softbade pricing[] shape semantically: plan, price, and details.
- Extract every distinct official pricing plan that can be explicitly identified from the supplied official text.
- There is no fixed number of full pricing plans and no required plan naming convention.
- Use the actual official visible plan name. Do not normalize plan names unnecessarily.
- Keep pricing information attached to the plan it belongs to. Never move a price from one plan into another plan.
- If a plan name is verified but no explicit price is available, set that plan's price to null and use details only if concise official descriptive details are available.
- Preserve concise verified billing context in price or details, including monthly, annual, per-seat, per-user, custom pricing, contact sales, regional qualification, and plan variants when those belong to that plan.
- Do not invent missing prices or details.
- Do not return malformed placeholder prices such as "/ month", "From / month", "/ year", or "From / year"; use null instead.
- Do not force fullPricingPlans into Free, Starting, Monthly, Annual, Team, or Enterprise.
- Do not include non-pricing product names unless they are explicitly presented as pricing plans, packages, or tiers.
- Keep each fullPricingPlans.details value concise enough for the existing Softbade Pricing section, approximately one sentence and normally under 160 characters when practical.
- Put detailed supporting text in fullPricingPlans.evidence, not details.
- Each fullPricingPlans item must include short evidence from the supplied text. If evidence is insufficient for a plan, omit that plan.

Fields:
- freePlan
- startingPrice
- annualBilling
- monthlyBilling
- teamPlan
- enterprisePlan
- fullPricingPlans
- localeSpecific
- localeEvidence
- noPricingPublished
- noPricingPublishedEvidence
- fieldAmbiguity
- ambiguityEvidence

Page text:
${pageText}`,
    },
  ];
}

function extractResponseText(apiResult) {
  if (typeof apiResult.output_text === "string") {
    return apiResult.output_text;
  }

  const textParts = [];
  for (const item of apiResult.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }
  return textParts.join("");
}

async function extractPricingWithOpenAI(tool, pageText, requestedSourceUrl, finalSourceUrl) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: buildExtractionPrompt(tool, pageText, requestedSourceUrl, finalSourceUrl),
      text: {
        format: {
          type: "json_schema",
          name: "softbade_pricing_extraction",
          strict: true,
          schema: OPENAI_SCHEMA,
        },
      },
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI API returned HTTP ${response.status}: ${bodyText}`);
  }

  let apiResult;
  try {
    apiResult = JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`OpenAI API returned non-JSON response: ${error.message}`);
  }

  const outputText = extractResponseText(apiResult);
  if (!outputText) {
    throw new Error("OpenAI API response did not include structured output text");
  }

  try {
    return annotateFullPricingPlans(JSON.parse(outputText), finalSourceUrl);
  } catch (error) {
    throw new Error(`Could not parse OpenAI structured JSON output: ${error.message}`);
  }
}

function usefulText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function hasExplicitPricingAmount(value) {
  return /(?:\$|€|£|¥|₹|usd|eur|gbp|cad|aud)\s*\d|\d+(?:\.\d+)?\s*(?:\$|€|£|¥|₹|usd|eur|gbp|cad|aud)/i.test(String(value ?? ""));
}

function malformedPricePlaceholder(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return /^(?:from\s+)?(?:[$€£¥₹]\s*)?\/\s*(?:mo|month|yr|year|monthly|yearly|annually|annual)$/i.test(normalized);
}

function preserveMaterialPriceQualifiers(price, evidence) {
  if (!usefulText(price) || !usefulText(evidence)) return price;

  const evidenceText = evidence.replace(/\s+/g, " ");
  const segments = price.split(/\s*;\s*/).map((segment) => {
    if (/\bper\s+(?:seat|user|member|workspace)\b/i.test(segment)) return segment;

    const amountMatch = segment.match(/(?:\$|€|£|¥|₹|usd|eur|gbp|cad|aud)\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:\$|€|£|¥|₹|usd|eur|gbp|cad|aud)/i);
    if (!amountMatch) return segment;

    const billingPattern = /\bannual|yearly|annually|billed yearly|billed annually\b/i.test(segment)
      ? /\bannual|yearly|annually|billed yearly|billed annually\b/i
      : /\bmonthly|per month|\/month|\/mo|billed monthly\b/i.test(segment)
        ? /\bmonthly|per month|\/month|\/mo|billed monthly\b/i
        : null;
    const amountIndex = evidenceText.toLowerCase().indexOf(amountMatch[0].toLowerCase());
    if (amountIndex === -1) return segment;

    const evidenceWindow = evidenceText.slice(Math.max(0, amountIndex - 80), amountIndex + 160);
    const unitMatch = evidenceWindow.match(/\bper\s+(?:seat|user|member|workspace)\b/i);
    if (!unitMatch) return segment;
    if (billingPattern && !billingPattern.test(evidenceWindow)) return segment;

    return segment.replace(/((?:\/|per\s+)mo(?:nth)?|\bmonthly\b|\bper month\b)/i, (match) => `${match} ${unitMatch[0].toLowerCase()}`);
  });

  return segments.join("; ");
}

function sanitizePriceValue(value, evidence = "") {
  if (!usefulText(value)) return null;
  const trimmed = value.trim();
  return malformedPricePlaceholder(trimmed) ? null : preserveMaterialPriceQualifiers(trimmed, evidence);
}

function concisePlanDetails(value) {
  if (!usefulText(value)) return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 180) return trimmed;

  const sentenceEnd = trimmed.search(/[.!?]\s/);
  if (sentenceEnd > 40 && sentenceEnd <= 180) {
    return trimmed.slice(0, sentenceEnd + 1);
  }

  return `${trimmed.slice(0, 177).trimEnd()}...`;
}

function normalizeFullPricingPlans(plans, sourceUrl) {
  if (!Array.isArray(plans)) return [];

  const normalizedPlans = plans
    .filter((plan) => plan && usefulText(plan.plan) && usefulText(plan.evidence))
    .map((plan) => ({
      plan: plan.plan.trim(),
      price: sanitizePriceValue(plan.price, plan.evidence),
      details: concisePlanDetails(plan.details),
      evidence: plan.evidence.trim(),
      source: sourceUrl,
    }));

  return mergeFullPricingPlans(normalizedPlans, []);
}

function annotateFullPricingPlans(extracted, sourceUrl) {
  return sanitizeExtraction({
    ...extracted,
    fullPricingPlans: normalizeFullPricingPlans(extracted.fullPricingPlans, sourceUrl),
  });
}

function fullPricingPlanKey(plan) {
  return normalizedPlanIdentity(plan.plan, null) ?? normalizeValue(canonicalVisiblePlanName(plan.plan));
}

function mergeFullPricingPlans(primaryPlans, secondaryPlans) {
  const merged = [];
  const planIndexes = new Map();

  for (const plan of [...(primaryPlans ?? []), ...(secondaryPlans ?? [])]) {
    const key = fullPricingPlanKey(plan);
    if (!key) continue;

    const existingIndex = planIndexes.get(key);
    if (existingIndex === undefined) {
      planIndexes.set(key, merged.length);
      merged.push({
        ...plan,
        plan: canonicalVisiblePlanName(plan.plan),
      });
      continue;
    }

    const existing = merged[existingIndex];
    merged[existingIndex] = {
      plan: preferCanonicalPlanName(existing.plan, plan.plan),
      price: mergePlanPrice(existing.price, plan.price),
      details: mergePlanDetails(existing.details, plan.details, existing, plan),
      evidence: appendEvidence(existing.evidence, plan.evidence),
      source: unique([existing.source, plan.source]).join("; "),
    };
  }

  return merged;
}

function stripVendorPrefix(planName) {
  return String(planName ?? "")
    .replace(/^(?:chatgpt|claude|jasper ai|jasper)\s+/i, "")
    .trim();
}

function canonicalVisiblePlanName(planName) {
  return stripVendorPrefix(planName)
    .replace(/\s*\((?:self-serve|self serve|sales-assisted|sales assisted|direct purchase|contact sales|purchase path|sales channel|onboarding route)\)\s*/gi, "")
    .replace(/\s+(?:5x|20x)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function preferCanonicalPlanName(existingName, candidateName) {
  const existing = canonicalVisiblePlanName(existingName);
  const candidate = canonicalVisiblePlanName(candidateName);
  if (existing.length <= candidate.length) return existing;
  return candidate;
}

function priceSemantics(value) {
  const text = normalizeValue(value);
  const amount = monthlyPriceAmount(value, "");
  const billing = billingContextIdentity(value, "");
  const currency = /\$|usd/.test(text)
    ? "usd"
    : /€|eur/.test(text)
      ? "eur"
      : /£|gbp/.test(text)
        ? "gbp"
        : null;
  const region = /\b(region|regional|country|countries|market|markets|localized|localised|in the us|u\.s\.|united states)\b/.test(text)
    ? text.match(/\b(in the us|u\.s\.|united states|localized|localised|regional|country|market)\b/)?.[0] ?? "regional"
    : null;
  const seatContext = /\bseat|user|member\b/.test(text);
  const annualContext = /\bannual|yearly|billed annually|billed yearly\b/.test(text);

  return { amount, billing, currency, region, seatContext, annualContext };
}

function semanticallySamePrice(existingPrice, candidatePrice) {
  if (valuesMateriallyMatch(existingPrice, candidatePrice)) return true;

  const existing = priceSemantics(existingPrice);
  const candidate = priceSemantics(candidatePrice);
  if (existing.amount === null || candidate.amount === null || existing.amount !== candidate.amount) return false;
  if (existing.currency && candidate.currency && existing.currency !== candidate.currency) return false;
  if (existing.billing && candidate.billing && existing.billing !== candidate.billing) return false;
  if (existing.region || candidate.region) return existing.region === candidate.region;
  if (existing.seatContext !== candidate.seatContext) return false;
  if (existing.annualContext !== candidate.annualContext) return false;
  return true;
}

function conciseEquivalentPrice(existingPrice, candidatePrice) {
  return String(existingPrice).length <= String(candidatePrice).length ? existingPrice : candidatePrice;
}

function mergePlanPrice(existingPrice, candidatePrice) {
  if (!existingPrice) return candidatePrice ?? null;
  if (!candidatePrice) return existingPrice;
  if (semanticallySamePrice(existingPrice, candidatePrice)) return conciseEquivalentPrice(existingPrice, candidatePrice);

  const existingHasAmount = hasExplicitPricingAmount(existingPrice);
  const candidateHasAmount = hasExplicitPricingAmount(candidatePrice);
  if (existingHasAmount && !candidateHasAmount) return existingPrice;
  if (!existingHasAmount && candidateHasAmount) return candidatePrice;

  return unique([existingPrice, candidatePrice]).join("; ");
}

function mergePlanDetails(existingDetails, candidateDetails, existingPlan = {}, candidatePlan = {}) {
  const variantContext = planVariantContext(existingPlan, candidatePlan);
  const parts = unique([existingDetails, candidateDetails, variantContext].filter(usefulText).map(cleanPlanDetail));
  if (parts.length === 0) return null;
  if (variantContext) {
    const baseDetail = parts.find((part) => part !== variantContext);
    return concisePlanDetails([baseDetail, variantContext].filter(Boolean).join(" "));
  }
  return concisePlanDetails(parts[0]);
}

function cleanPlanDetail(value) {
  return String(value ?? "")
    .replace(/\b(?:announcement|announced|introducing|launched|ad[- ]?testing|ads? experiment)[^.?!;]*(?:[.?!;]|$)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function planVariantContext(existingPlan, candidatePlan) {
  const combinedText = normalizeValue([
    existingPlan.plan,
    existingPlan.details,
    existingPlan.evidence,
    candidatePlan.plan,
    candidatePlan.details,
    candidatePlan.evidence,
  ].join(" "));
  const canonicalIdentity = normalizedPlanIdentity(candidatePlan.plan ?? existingPlan.plan, null);

  if (canonicalIdentity === "max" && /\b5x\b/.test(combinedText) && /\b20x\b/.test(combinedText)) {
    return "Choose 5x or 20x more usage than Pro.";
  }

  if (
    canonicalIdentity === "enterprise" &&
    /\bself[- ]?serve\b/.test(combinedText) &&
    /\bsales[- ]?assisted\b|\bcontact sales\b|\btailored quote\b/.test(combinedText)
  ) {
    return "Available self-serve or via sales for a tailored quote.";
  }

  return null;
}

function sanitizeExtraction(extracted) {
  let sanitized = { ...extracted };

  for (const field of COMPARED_FIELDS) {
    if (malformedPricePlaceholder(sanitized[field])) {
      sanitized = {
        ...sanitized,
        [field]: null,
        evidence: {
          ...sanitized.evidence,
          [field]: appendEvidence(sanitized.evidence?.[field], "Malformed placeholder price was ignored."),
        },
      };
    }
  }

  for (const field of ["annualBilling", "monthlyBilling"]) {
    if (sanitized[field] !== null && !hasExplicitPricingAmount(sanitized[field])) {
      sanitized = {
        ...sanitized,
        [field]: null,
        fieldAmbiguity: {
          ...sanitized.fieldAmbiguity,
          [field]: true,
        },
        ambiguityEvidence: {
          ...sanitized.ambiguityEvidence,
          [field]: `${FIELD_LABELS[field]} availability was indicated, but no explicit pricing amount for that exact billing context was verified.`,
        },
      };
    }
  }

  return enforceLowestPaidTierStartingPrice(sanitized);
}

function planRank(identity) {
  const ranks = {
    free: 0,
    go: 1,
    starter: 1,
    creator: 1,
    individual: 1,
    plus: 2,
    pro: 3,
    team: 4,
    business: 5,
    enterprise: 6,
  };
  return ranks[identity] ?? null;
}

function lowerTierPricingIsUnsafe(plan) {
  const text = normalizeValue(`${plan.price ?? ""} ${plan.details ?? ""} ${plan.evidence ?? ""}`);
  if (plan.price === null || malformedPricePlaceholder(plan.price)) return true;
  return /\b(region|regional|country|countries|market|markets|localized|localised|in the us|u\.s\.|united states|available in)\b/.test(text);
}

function enforceLowestPaidTierStartingPrice(extracted) {
  if (extracted.startingPrice === null || extracted.fieldAmbiguity?.startingPrice) return extracted;

  const startingIdentity = normalizedPlanIdentity(extracted.startingPrice, extracted.evidence?.startingPrice);
  const startingRank = planRank(startingIdentity);
  if (startingRank === null || startingRank <= 1) return extracted;

  if (subscriptionPlanExtractionIncomplete(extracted.fullPricingPlans)) {
    return {
      ...extracted,
      startingPrice: null,
      fieldAmbiguity: {
        ...extracted.fieldAmbiguity,
        startingPrice: true,
      },
      ambiguityEvidence: {
        ...extracted.ambiguityEvidence,
        startingPrice: "Full subscription-plan extraction appears incomplete, so lower-tier completeness is uncertain. Starting Price must not be inferred from a higher visible paid plan.",
      },
    };
  }

  const lowerPaidPlan = (extracted.fullPricingPlans ?? []).find((plan) => {
    const identity = normalizedPlanIdentity(plan.plan, plan.evidence);
    const rank = planRank(identity);
    if (rank === null || rank <= 0 || rank >= startingRank) return false;
    const text = normalizeValue(`${plan.plan} ${plan.price ?? ""} ${plan.details ?? ""} ${plan.evidence ?? ""}`);
    return !/\bfree\b|\$0\b|\b0\s*(?:usd|eur|gbp)?\b/.test(text);
  });

  if (!lowerPaidPlan || !lowerTierPricingIsUnsafe(lowerPaidPlan)) return extracted;

  return {
    ...extracted,
    startingPrice: null,
    fieldAmbiguity: {
      ...extracted.fieldAmbiguity,
      startingPrice: true,
    },
    ambiguityEvidence: {
      ...extracted.ambiguityEvidence,
      startingPrice: `A lower paid tier (${lowerPaidPlan.plan}) appears before the verified higher tier, but its globally safe price is unresolved or region-qualified. Starting Price must not skip the lower tier.`,
    },
    evidence: {
      ...extracted.evidence,
      startingPrice: appendEvidence(extracted.evidence?.startingPrice, lowerPaidPlan.evidence),
    },
  };
}

function subscriptionPlanExtractionIncomplete(plans) {
  const subscriptionPlans = (plans ?? []).filter((plan) => pricingFamily(plan) === "SUBSCRIPTION_PLAN");
  if (subscriptionPlans.length === 0) return true;

  const identities = new Set(subscriptionPlans.map((plan) => pricingPlanIdentity(plan)).filter(Boolean));
  const hasEntryOrFreePlan = ["free", "go", "starter", "creator", "individual", "plus", "pro"].some((identity) => identities.has(identity));
  const hasOrganizationalPlan = ["team", "business", "enterprise"].some((identity) => identities.has(identity));

  return !hasEntryOrFreePlan && !hasOrganizationalPlan;
}

function normalizeValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\busd\b/g, "$")
    .replace(/custom pricing/g, "custom")
    .replace(/contact sales/g, "custom")
    .replace(/\.$/, "")
    .trim();
}

function valuesMateriallyMatch(current, verified) {
  if (current === null || verified === null) return false;
  const normalizedCurrent = normalizeValue(current);
  const normalizedVerified = normalizeValue(verified);
  return (
    normalizedCurrent === normalizedVerified ||
    normalizedCurrent.includes(normalizedVerified) ||
    normalizedVerified.includes(normalizedCurrent)
  );
}

function displayCurrent(value) {
  return value === null ? "Not present" : value;
}

function statusFor(field, current, verified, extracted, fetchStatus) {
  if (fetchStatus !== "OK") return "ERROR";
  if (fieldHasSafetyBlock(field, extracted) || extracted.fieldAmbiguity?.[field]) return "REVIEW";
  if (verified === null) return "REVIEW";
  return valuesMateriallyMatch(current, verified) ? "MATCH" : "CHANGE";
}

function displayVerified(value) {
  return value === null ? "Not explicitly verified" : value;
}

function safeToUpdate(field, status, verified, evidence, extracted, fetchStatus) {
  return status === "CHANGE" &&
    verified !== null &&
    Boolean(evidence?.trim()) &&
    fetchStatus === "OK" &&
    !fieldHasSafetyBlock(field, extracted) &&
    !extracted.fieldAmbiguity?.[field]
    ? "YES"
    : "NO";
}

function checkedMonthYear() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function fieldShouldPrint(field, current, extracted) {
  return current[field] !== null || extracted[field] !== null || !["annualBilling", "monthlyBilling"].includes(field);
}

function localePricingStatus(fetchStatus, extracted) {
  if (fetchStatus !== "OK") return "UNKNOWN";
  return extracted.localeSpecific ? "REGION_SPECIFIC" : "GENERIC";
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sourceScopeStatus(tool, requestedSourceUrl, finalSourceUrl, fetchStatus) {
  if (fetchStatus !== "OK") return "UNKNOWN";

  let requested;
  let final;
  try {
    requested = new URL(requestedSourceUrl);
    final = new URL(finalSourceUrl);
  } catch {
    return "UNKNOWN";
  }

  const requestedPath = requested.pathname.replace(/\/+$/, "") || "/";
  const finalPath = final.pathname.replace(/\/+$/, "") || "/";
  const requestedGenericPricing = requestedPath === "/pricing";

  if (!requestedGenericPricing) return "GENERIC";
  if (finalPath === requestedPath) return "GENERIC";

  const productSpecificPath =
    /^\/pricing\/[^/]+/.test(finalPath) ||
    /^\/products\/[^/]+\/pricing/.test(finalPath) ||
    /^\/products\/[^/]+\/[^/]*pricing/.test(finalPath);

  if (!productSpecificPath) return "GENERIC";

  const finalSlug = slugify(finalPath);
  const toolSlugs = [tool.name, ...tool.name.split(/\s+/)].map(slugify).filter(Boolean);
  const finalMatchesTool = toolSlugs.some((toolSlug) => toolSlug && finalSlug.includes(toolSlug));

  return finalMatchesTool ? "GENERIC" : "PRODUCT_SPECIFIC";
}

function combinedEvidence(field, extracted, fetchStatus) {
  const evidence = [];
  if (fetchStatus === "ERROR") {
    evidence.push(extracted.fetchError || "Official pricing page or API could not be verified.");
  }
  if (extracted.evidence?.[field]) {
    evidence.push(extracted.evidence[field]);
  }
  if (fieldHasLocaleBlock(field, extracted)) {
    evidence.push(`Locale-specific pricing requires review${extracted.localeEvidence ? `: ${extracted.localeEvidence}` : ""}`);
  }
  if (fieldHasProductScopeBlock(field, extracted)) {
    evidence.push("Pricing source is product-specific and cannot safely update the generic Softbade profile.");
  }
  if (extracted.fieldAmbiguity?.[field]) {
    evidence.push(`Complex product pricing requires review${extracted.ambiguityEvidence?.[field] ? `: ${extracted.ambiguityEvidence[field]}` : ""}`);
  }
  return evidence.join(" ");
}

function effectiveVerificationFetchStatus(fetchStatus, extracted) {
  return fetchStatus === "ERROR" && hasUsefulVerifiedPricing(extracted) && extracted.secondaryFallbackPrimaryFetchFailed
    ? "OK"
    : fetchStatus;
}

function emptyExtraction(fetchError = null) {
  return {
    freePlan: null,
    startingPrice: null,
    annualBilling: null,
    monthlyBilling: null,
    teamPlan: null,
    enterprisePlan: null,
    localeSpecific: false,
    localeEvidence: null,
    noPricingPublished: false,
    noPricingPublishedEvidence: null,
    fullPricingPlans: [],
    sourceScopeStatus: "UNKNOWN",
    fetchError,
    fieldAmbiguity: {
      freePlan: false,
      startingPrice: false,
      annualBilling: false,
      monthlyBilling: false,
      teamPlan: false,
      enterprisePlan: false,
    },
    ambiguityEvidence: {
      freePlan: null,
      startingPrice: null,
      annualBilling: null,
      monthlyBilling: null,
      teamPlan: null,
      enterprisePlan: null,
    },
    evidence: {
      freePlan: null,
      startingPrice: null,
      annualBilling: null,
      monthlyBilling: null,
      teamPlan: null,
      enterprisePlan: null,
    },
    fieldProvenance: {
      freePlan: null,
      startingPrice: null,
      annualBilling: null,
      monthlyBilling: null,
      teamPlan: null,
      enterprisePlan: null,
    },
    secondaryLocaleFields: {
      freePlan: false,
      startingPrice: false,
      annualBilling: false,
      monthlyBilling: false,
      teamPlan: false,
      enterprisePlan: false,
    },
    secondaryProductSpecificFields: {
      freePlan: false,
      startingPrice: false,
      annualBilling: false,
      monthlyBilling: false,
      teamPlan: false,
      enterprisePlan: false,
    },
  };
}

function hasUsefulVerifiedPricing(extracted) {
  return COMPARED_FIELDS.some((field) => extracted[field] !== null && Boolean(extracted.evidence?.[field]?.trim()) && !extracted.fieldAmbiguity?.[field]);
}

function shouldRetryWithPlaywrightAfterExtraction(fetched, extracted) {
  return fetched.fetchMethod === "HTTP" && !hasUsefulVerifiedPricing(extracted) && !extracted.noPricingPublished;
}

function normalizeExtractionForReport(extracted, sourceScope) {
  return { ...extracted, sourceScopeStatus: sourceScope };
}

function hasAnyTrueValue(values) {
  return Object.values(values ?? {}).some(Boolean);
}

function fieldHasLocaleBlock(field, extracted) {
  if (!extracted.localeSpecific) return false;
  if (hasAnyTrueValue(extracted.secondaryLocaleFields)) {
    return extracted.secondaryLocaleFields?.[field] === true;
  }
  return true;
}

function fieldHasProductScopeBlock(field, extracted) {
  if (extracted.sourceScopeStatus === "PRODUCT_SPECIFIC" && !hasAnyTrueValue(extracted.secondaryProductSpecificFields)) {
    return true;
  }
  return extracted.secondaryProductSpecificFields?.[field] === true;
}

function fieldHasSafetyBlock(field, extracted) {
  return fieldHasLocaleBlock(field, extracted) || fieldHasProductScopeBlock(field, extracted);
}

function hasGlobalSourceLevelBlock(extracted, fetchStatus) {
  return fetchStatus !== "OK" ||
    (extracted.localeSpecific && !hasAnyTrueValue(extracted.secondaryLocaleFields)) ||
    (extracted.sourceScopeStatus === "PRODUCT_SPECIFIC" && !hasAnyTrueValue(extracted.secondaryProductSpecificFields));
}

function trustedSecondarySource(slug, sourceUrl) {
  const config = SECONDARY_SOURCE_CONFIG[slug];
  if (!config) return false;

  try {
    const hostname = new URL(sourceUrl).hostname;
    return config.trustedDomains.includes(hostname);
  } catch {
    return false;
  }
}

function unresolvedFieldsForFallback(extracted, fetchStatus) {
  const primaryFetchFailed = fetchStatus === "ERROR";
  if (!primaryFetchFailed && fetchStatus !== "OK") return [];
  if (extracted.localeSpecific || extracted.sourceScopeStatus === "PRODUCT_SPECIFIC") return [];

  return COMPARED_FIELDS.filter((field) =>
    extracted[field] === null &&
    !extracted.fieldAmbiguity?.[field]
  );
}

function appendEvidence(existing, addition) {
  return [existing, addition].filter(Boolean).join(" ");
}

function normalizedPlanIdentity(value, evidence) {
  const text = normalizeValue(`${value ?? ""} ${evidence ?? ""}`);
  const planPatterns = [
    ["education", /\beducation\b/],
    ["max", /\bmax\b/],
    ["enterprise", /\benterprise\b/],
    ["business", /\bbusiness\b/],
    ["team", /\bteams?\b/],
    ["pro", /\bpro\b/],
    ["plus", /\bplus\b/],
    ["go", /\bgo\b/],
    ["free", /\bfree\b/],
    ["starter", /\bstarter\b/],
    ["creator", /\bcreator\b/],
    ["individual", /\bindividual\b/],
  ];

  for (const [identity, pattern] of planPatterns) {
    if (pattern.test(text)) return identity;
  }

  return null;
}

function billingContextIdentity(value, evidence) {
  const text = normalizeValue(`${value ?? ""} ${evidence ?? ""}`);
  if (/\bannual\b|\byearly\b|\bbilled yearly\b|\bbilled annually\b/.test(text)) return "annual";
  if (/\bmonthly\b|\bper month\b|\/month|\bmo\b/.test(text)) return "monthly";
  return null;
}

function monthlyPriceAmount(value, evidence) {
  const text = `${value ?? ""} ${evidence ?? ""}`;
  const match = text.match(/(?:\$|usd\s*)\s*(\d+(?:\.\d+)?)/i);
  return match ? Number.parseFloat(match[1]) : null;
}

function sameSemanticPricingEntity(field, primary, secondary) {
  const primaryPlan = normalizedPlanIdentity(primary[field], primary.evidence?.[field]);
  const secondaryPlan = normalizedPlanIdentity(secondary[field], secondary.evidence?.[field]);

  if (primaryPlan && secondaryPlan && primaryPlan !== secondaryPlan) return false;
  if (!primaryPlan || !secondaryPlan) return false;

  const primaryBilling = billingContextIdentity(primary[field], primary.evidence?.[field]);
  const secondaryBilling = billingContextIdentity(secondary[field], secondary.evidence?.[field]);
  if (primaryBilling && secondaryBilling && primaryBilling !== secondaryBilling) return false;

  return true;
}

function secondaryIsLowerStartingPrice(primary, secondary) {
  const primaryPlan = normalizedPlanIdentity(primary.startingPrice, primary.evidence?.startingPrice);
  const secondaryPlan = normalizedPlanIdentity(secondary.startingPrice, secondary.evidence?.startingPrice);
  if (!primaryPlan || !secondaryPlan || primaryPlan === secondaryPlan) return false;

  const primaryAmount = monthlyPriceAmount(primary.startingPrice, primary.evidence?.startingPrice);
  const secondaryAmount = monthlyPriceAmount(secondary.startingPrice, secondary.evidence?.startingPrice);
  return primaryAmount !== null && secondaryAmount !== null && secondaryAmount < primaryAmount;
}

function mergeSecondaryField(merged, field, secondaryValue, secondaryEvidence, primarySourceUrl, secondarySourceUrl, primaryFetchFailed, secondary) {
  return {
    ...merged,
    [field]: secondaryValue,
    secondaryFallbackPrimaryFetchFailed: merged.secondaryFallbackPrimaryFetchFailed === true,
    localeSpecific: merged.localeSpecific || secondary.localeSpecific,
    localeEvidence: secondary.localeSpecific
      ? appendEvidence(
          merged.localeEvidence,
          `Official secondary source ${secondarySourceUrl} indicated locale-specific pricing${secondary.localeEvidence ? `: ${secondary.localeEvidence}` : "."}`,
        )
      : merged.localeEvidence,
    fieldProvenance: {
      ...merged.fieldProvenance,
      [field]: "SECONDARY",
    },
    secondaryLocaleFields: {
      ...merged.secondaryLocaleFields,
      [field]: secondary.localeSpecific === true,
    },
    evidence: {
      ...merged.evidence,
      [field]: [
        `Primary pricing source: ${primarySourceUrl}.`,
        primaryFetchFailed
          ? `Primary pricing source failed before usable pricing could be extracted.`
          : `${FIELD_LABELS[field]} unresolved or superseded by a lower official paid tier.`,
        `Official secondary source: ${secondarySourceUrl}.`,
        `${FIELD_LABELS[field]} verified from official secondary source.`,
        secondaryEvidence,
      ].join(" "),
    },
    ambiguityEvidence: {
      ...merged.ambiguityEvidence,
      [field]: secondary.ambiguityEvidence?.[field] ?? merged.ambiguityEvidence?.[field] ?? null,
    },
  };
}

function mergeSecondaryExtraction(primary, secondary, unresolvedFields, primarySourceUrl, secondarySourceUrl) {
  let merged = {
    ...primary,
    fullPricingPlans: mergeFullPricingPlans(primary.fullPricingPlans, secondary.fullPricingPlans),
  };
  const primaryFetchFailed = primary.secondaryFallbackPrimaryFetchFailed === true;
  const filledFields = [];

  for (const field of COMPARED_FIELDS) {
    if (primaryFetchFailed) continue;
    if (unresolvedFields.includes(field)) continue;
    if (primary[field] === null || secondary[field] === null || !secondary.evidence?.[field]?.trim()) continue;
    if (valuesMateriallyMatch(primary[field], secondary[field])) continue;
    if (!sameSemanticPricingEntity(field, primary, secondary)) continue;

    merged = {
      ...merged,
      [field]: null,
      fieldAmbiguity: {
        ...merged.fieldAmbiguity,
        [field]: true,
      },
      ambiguityEvidence: {
        ...merged.ambiguityEvidence,
        [field]: `Official sources conflict. Primary source ${primarySourceUrl} supported "${primary[field]}"; secondary source ${secondarySourceUrl} supported "${secondary[field]}".`,
      },
      evidence: {
        ...merged.evidence,
        [field]: appendEvidence(
          merged.evidence?.[field],
          `Official secondary source conflict: ${secondarySourceUrl}. ${secondary.evidence[field]}`,
        ),
      },
    };
  }

  if (
    !unresolvedFields.includes("startingPrice") &&
    secondary.startingPrice !== null &&
    secondary.evidence?.startingPrice?.trim() &&
    secondaryIsLowerStartingPrice(primary, secondary)
  ) {
    merged = mergeSecondaryField(
      merged,
      "startingPrice",
      secondary.startingPrice,
      secondary.evidence.startingPrice,
      primarySourceUrl,
      secondarySourceUrl,
      primaryFetchFailed,
      secondary,
    );
    filledFields.push("startingPrice");
  }

  for (const field of unresolvedFields) {
    const secondaryValue = secondary[field];
    const secondaryEvidence = secondary.evidence?.[field];
    if (secondaryValue === null || !secondaryEvidence?.trim() || secondary.fieldAmbiguity?.[field]) continue;

    merged = mergeSecondaryField(
      merged,
      field,
      secondaryValue,
      secondaryEvidence,
      primarySourceUrl,
      secondarySourceUrl,
      primaryFetchFailed,
      secondary,
    );
    filledFields.push(field);
  }

  return { merged, filledFields };
}

async function applySecondarySourceFallback(slug, tool, extracted, fetchStatus, primarySourceUrl) {
  const config = SECONDARY_SOURCE_CONFIG[slug];
  if (!config) return { extracted, usedSources: [], filledFields: [] };

  let working = extracted;
  const usedSources = [];
  const filledFields = [];

  for (const sourceUrl of config.sources) {
    const unresolvedFields = unresolvedFieldsForFallback(working, fetchStatus);
    if (unresolvedFields.length === 0) break;
    if (!trustedSecondarySource(slug, sourceUrl)) continue;

    const secondaryFetched = await fetchPricingPage(sourceUrl);
    if (secondaryFetched.fetchStatus === "ERROR") {
      usedSources.push({ sourceUrl, finalUrl: secondaryFetched.finalUrl, fetchStatus: secondaryFetched.fetchStatus, fetchMethod: secondaryFetched.fetchMethod, filledFields: [] });
      continue;
    }

    const secondaryExtraction = await extractPricingWithOpenAI(tool, secondaryFetched.text, sourceUrl, secondaryFetched.finalUrl);
    const secondarySourceScope = sourceScopeStatus(tool, sourceUrl, secondaryFetched.finalUrl, secondaryFetched.fetchStatus);
    if (secondarySourceScope === "PRODUCT_SPECIFIC") {
      working = {
        ...working,
        fetchError: appendEvidence(
          working.fetchError,
          `Official secondary source ${secondaryFetched.finalUrl} was product-specific and could not safely fill the generic profile.`,
        ),
      };
      usedSources.push({ sourceUrl, finalUrl: secondaryFetched.finalUrl, fetchStatus: secondaryFetched.fetchStatus, fetchMethod: secondaryFetched.fetchMethod, filledFields: [] });
      continue;
    }

    const { merged, filledFields: sourceFilledFields } = mergeSecondaryExtraction(
      working,
      secondaryExtraction,
      unresolvedFields,
      primarySourceUrl,
      secondaryFetched.finalUrl,
    );

    working = merged;
    usedSources.push({
      sourceUrl,
      finalUrl: secondaryFetched.finalUrl,
      fetchStatus: secondaryFetched.fetchStatus,
      fetchMethod: secondaryFetched.fetchMethod,
      filledFields: sourceFilledFields,
    });
    filledFields.push(...sourceFilledFields);
  }

  return { extracted: working, usedSources, filledFields };
}

async function extractionAfterPrimaryFailure(slug, tool, errorMessage, sourceScope, primarySourceUrl) {
  let extracted = normalizeExtractionForReport(
    { ...emptyExtraction(errorMessage), secondaryFallbackPrimaryFetchFailed: true },
    sourceScope,
  );
  if (SECONDARY_SOURCE_CONFIG[slug] && process.env.OPENAI_API_KEY) {
    const fallbackResult = await applySecondarySourceFallback(slug, tool, extracted, "ERROR", primarySourceUrl);
    extracted = fallbackResult.extracted;
  }
  return extracted;
}

function printReport(tool, requestedSourceUrl, finalSourceUrl, current, extracted, fetchStatus, fetchMethod, currentPricingPlans = []) {
  const statusFetchStatus = effectiveVerificationFetchStatus(fetchStatus, extracted);
  console.log("Softbade Pricing Check");
  console.log(`Tool: ${tool.name}`);
  console.log(`Requested Source: ${requestedSourceUrl}`);
  console.log(`Final Source: ${finalSourceUrl}`);
  console.log(`Source Scope Status: ${extracted.sourceScopeStatus ?? "UNKNOWN"}`);
  console.log(`Locale Pricing Status: ${localePricingStatus(statusFetchStatus, extracted)}`);
  console.log(`Fetch Status: ${fetchStatus}`);
  console.log(`Fetch Method: ${fetchMethod}`);
  console.log("");

  for (const field of COMPARED_FIELDS) {
    if (!fieldShouldPrint(field, current, extracted)) continue;

    const evidence = combinedEvidence(field, extracted, fetchStatus);
    const status = statusFor(field, current[field], extracted[field], extracted, statusFetchStatus);

    console.log(FIELD_LABELS[field]);
    console.log(`Current Softbade Value: ${displayCurrent(current[field])}`);
    console.log(`Verified Current Value: ${displayVerified(extracted[field])}`);
    console.log(`Status: ${status}`);
    console.log(`Safe to Update: ${safeToUpdate(field, status, extracted[field], evidence, extracted, statusFetchStatus)}`);
    if (evidence) {
      console.log(`Evidence: ${evidence}`);
    }
    console.log("");
  }

  console.log("Pricing Verified:");
  console.log(`Current Softbade Value: ${current.pricingVerified}`);
  console.log(`Checked today: ${checkedMonthYear()}`);
  printFullPricingPlansPreview(extracted.fullPricingPlans);
  printPricingProposalPreview(currentPricingPlans, extracted);
}

function printFullPricingPlansPreview(plans) {
  console.log("");
  console.log("FULL PRICING PLANS PREVIEW");
  console.log("");

  if (!Array.isArray(plans) || plans.length === 0) {
    console.log("No explicitly verified full pricing plans available.");
    return;
  }

  plans.forEach((plan, index) => {
    console.log(`${index + 1}. ${plan.plan}`);
    console.log(`   Price: ${displayVerified(plan.price)}`);
    if (plan.details) {
      console.log(`   Details: ${plan.details}`);
    }
    console.log(`   Source: ${plan.source ?? "Official source"}`);
    if (plan.evidence) {
      console.log(`   Evidence: ${plan.evidence}`);
    }
    console.log("");
  });
}

function proposalPrice(plan) {
  return plan.price ?? "Not explicitly verified";
}

function proposalDetails(plan) {
  return plan.details ?? "";
}

function planHasLocaleReviewSignal(plan) {
  const text = normalizeValue(`${plan.price ?? ""} ${plan.details ?? ""} ${plan.evidence ?? ""}`);
  return /\b(region|regional|country|countries|market|markets|localized|localised|in the us|u\.s\.|united states|available in)\b/.test(text);
}

function planProposalSafety(plan, extracted) {
  if (subscriptionPlanExtractionIncomplete(extracted.fullPricingPlans)) return "REVIEW";
  if (plan.price === null) return "REVIEW";
  if (planHasLocaleReviewSignal(plan)) return "REVIEW";
  if (extracted.sourceScopeStatus === "PRODUCT_SPECIFIC") return "REVIEW";
  return "SAFE";
}

function pricingFamily(plan) {
  const planText = normalizeValue(plan.plan);
  const text = normalizeValue(`${plan.plan ?? ""} ${plan.price ?? ""} ${plan.details ?? ""} ${plan.evidence ?? ""}`);
  const identity = normalizedPlanIdentity(plan.plan, null);

  if (["free", "go", "plus", "pro", "max", "team", "business", "enterprise", "education", "starter", "creator", "individual"].includes(identity)) {
    return "SUBSCRIPTION_PLAN";
  }

  const modelUsagePlanName = (
    /\b(?:opus|sonnet|haiku|fable)\b/.test(planText) ||
    /\bmodel\b/.test(planText)
  );
  const apiUsageSignals = [
    /\binput\b.*(?:mtok|m tok|million tokens?|token)/,
    /\boutput\b.*(?:mtok|m tok|million tokens?|token)/,
    /\b(?:mtok|m tok|million tokens?|token pricing|api usage|per token)\b/,
    /\/\s*(?:m\s*)?tok\b/,
  ];

  if (modelUsagePlanName && apiUsageSignals.some((pattern) => pattern.test(text))) return "API_MODEL_USAGE";

  const subscriptionSignals = [
    /\bper\s+(?:seat|user|member)\b/,
    /\bseat\/month|user\/month|member\/month\b/,
    /\bmonthly|\/month|per month|annual|annually|yearly|\/year\b/,
    /\bcontact sales|custom pricing|free plan|paid plan\b/,
  ];
  if (subscriptionSignals.some((pattern) => pattern.test(text))) return "SUBSCRIPTION_PLAN";

  return plan.price === null ? "UNKNOWN" : "OTHER";
}

function concreteCurrentPrice(value) {
  const normalized = normalizeValue(value);
  if (!normalized || normalized === "unknown" || normalized === "not explicitly verified" || normalized === "paid plan") return false;
  return hasExplicitPricingAmount(value) || /\bfree\b|\$0\b|custom|contact sales|no free plan\b/.test(normalized);
}

function priceAmounts(value) {
  const matches = String(value ?? "").matchAll(/(?:\$|€|£|¥|₹|usd|eur|gbp|cad|aud)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:\$|€|£|¥|₹|usd|eur|gbp|cad|aud)/gi);
  return [...matches]
    .map((match) => Number.parseFloat(match[1] ?? match[2]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

function currencyIdentity(value) {
  const text = normalizeValue(value);
  if (/\$|usd/.test(text)) return "usd";
  if (/€|eur/.test(text)) return "eur";
  if (/£|gbp/.test(text)) return "gbp";
  if (/¥/.test(text)) return "jpy";
  if (/₹/.test(text)) return "inr";
  if (/\bcad\b/.test(text)) return "cad";
  if (/\baud\b/.test(text)) return "aud";
  return null;
}

function billingContexts(value) {
  const text = normalizeValue(value);
  const contexts = [];
  if (/\bannual\b|\byearly\b|\bannually\b|\bbilled yearly\b|\bbilled annually\b/.test(text)) contexts.push("annual");
  if (/\bmonthly\b|\bper month\b|\/month|\/mo|\bmo\b|\bbilled monthly\b/.test(text)) contexts.push("monthly");
  return contexts.sort();
}

function materialPriceUnits(value) {
  return unique([...String(value ?? "").matchAll(/\bper\s+(seat|user|member|workspace)\b/gi)].map((match) => match[1].toLowerCase()));
}

function samePriceAmountsCurrencyAndBilling(currentPrice, proposedPrice) {
  const currentAmounts = priceAmounts(currentPrice);
  const proposedAmounts = priceAmounts(proposedPrice);
  if (currentAmounts.length === 0 || currentAmounts.length !== proposedAmounts.length) return false;
  if (!currentAmounts.every((amount, index) => amount === proposedAmounts[index])) return false;

  const currentCurrency = currencyIdentity(currentPrice);
  const proposedCurrency = currencyIdentity(proposedPrice);
  if (currentCurrency && proposedCurrency && currentCurrency !== proposedCurrency) return false;

  const currentBilling = billingContexts(currentPrice);
  const proposedBilling = billingContexts(proposedPrice);
  return currentBilling.length === proposedBilling.length &&
    currentBilling.every((context, index) => context === proposedBilling[index]);
}

function evidenceContradictsMaterialUnit(currentUnit, evidence) {
  const evidenceUnits = materialPriceUnits(evidence);
  return evidenceUnits.length > 0 && !evidenceUnits.includes(currentUnit);
}

function shouldPreserveCurrentPriceMaterialQualifier(currentPrice, proposedPrice, evidence) {
  if (!usefulText(currentPrice) || !usefulText(proposedPrice)) return false;
  const currentUnits = materialPriceUnits(currentPrice);
  if (currentUnits.length === 0 || materialPriceUnits(proposedPrice).length > 0) return false;
  if (!samePriceAmountsCurrencyAndBilling(currentPrice, proposedPrice)) return false;
  return currentUnits.every((unit) => !evidenceContradictsMaterialUnit(unit, evidence));
}

function currentPlanForProposal(plan, currentPlans) {
  const identity = pricingPlanIdentity(plan);
  if (!identity) return null;
  return (currentPlans ?? []).find((currentPlan) => !isLegacyCombinedPlan(currentPlan.plan) && pricingPlanIdentity(currentPlan) === identity) ?? null;
}

function proposedPricingPlans(extracted, currentPlans = []) {
  return (extracted.fullPricingPlans ?? [])
    .filter((plan) => pricingFamily(plan) === "SUBSCRIPTION_PLAN")
    .map((plan) => {
      const currentPlan = currentPlanForProposal(plan, currentPlans);
      const shouldPreserveCurrentPrice = plan.price === null && currentPlan && concreteCurrentPrice(currentPlan.price);
      const shouldPreserveMaterialQualifier = currentPlan &&
        shouldPreserveCurrentPriceMaterialQualifier(currentPlan.price, proposalPrice(plan), plan.evidence);
      return {
        plan: plan.plan,
        price: shouldPreserveCurrentPrice || shouldPreserveMaterialQualifier ? currentPlan.price : proposalPrice(plan),
        details: proposalDetails(plan),
        proposalSafety: planProposalSafety(plan, extracted),
        priceSource: shouldPreserveCurrentPrice
          ? "Preserved from current pricing[]"
          : shouldPreserveMaterialQualifier
            ? "Preserved from current pricing[] (material qualifier)"
            : "Verified from official source",
      };
    });
}

function pricingPlanIdentity(plan) {
  return normalizedPlanIdentity(plan.plan, null) ?? normalizeValue(canonicalVisiblePlanName(plan.plan));
}

function isLegacyCombinedPlan(planName) {
  const parts = String(planName ?? "").split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return false;
  const identities = parts.map((part) => normalizedPlanIdentity(part, null)).filter(Boolean);
  return new Set(identities).size >= 2;
}

function samePricingPlanEntry(currentPlan, proposedPlan) {
  const pricesMatch = valuesMateriallyMatch(currentPlan.price, proposedPlan.price);
  const detailsMatch = normalizeValue(currentPlan.details) === normalizeValue(proposedPlan.details);
  return pricesMatch && detailsMatch;
}

function pricingProposalSummary(currentPlans, proposedPlans, extracted) {
  const extractionIncomplete = subscriptionPlanExtractionIncomplete(extracted.fullPricingPlans);
  const currentByIdentity = new Map();
  const proposedByIdentity = new Map();

  for (const plan of currentPlans ?? []) {
    if (isLegacyCombinedPlan(plan.plan)) continue;
    const identity = pricingPlanIdentity(plan);
    if (identity && !currentByIdentity.has(identity)) currentByIdentity.set(identity, plan);
  }

  for (const plan of proposedPlans) {
    const identity = pricingPlanIdentity(plan);
    if (identity && !proposedByIdentity.has(identity)) proposedByIdentity.set(identity, plan);
  }

  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];
  const needsReview = [];

  for (const [identity, proposedPlan] of proposedByIdentity.entries()) {
    const currentPlan = currentByIdentity.get(identity);
    if (!currentPlan) {
      added.push(proposedPlan.plan);
    } else if (samePricingPlanEntry(currentPlan, proposedPlan)) {
      unchanged.push(proposedPlan.plan);
    } else {
      changed.push(`${proposedPlan.plan} pricing/details updated`);
    }

    if (proposedPlan.proposalSafety === "REVIEW") {
      const reason = proposedPlan.price === "Not explicitly verified"
        ? "price not explicitly verified"
        : "manual review required";
      needsReview.push(`${proposedPlan.plan}: ${reason}`);
    }
  }

  if (!extractionIncomplete) {
    for (const [identity, currentPlan] of currentByIdentity.entries()) {
      if (!proposedByIdentity.has(identity)) {
        removed.push(currentPlan.plan);
      }
    }

    for (const plan of currentPlans ?? []) {
      if (isLegacyCombinedPlan(plan.plan)) {
        removed.push(plan.plan);
      }
    }
  } else {
    needsReview.push("Pricing plan extraction appears incomplete; destructive plan removals are suppressed.");
  }

  return { added, removed, changed, unchanged, needsReview };
}

function printPlanList(plans, includeSafety = false) {
  if (!Array.isArray(plans) || plans.length === 0) {
    console.log("No pricing[] entries available.");
    return;
  }

  plans.forEach((plan, index) => {
    console.log(`${index + 1}. ${plan.plan}`);
    console.log(`   Price: ${plan.price}`);
    console.log(`   Details: ${plan.details || "Not explicitly verified"}`);
    if (includeSafety) {
      console.log(`   Proposal Safety: ${plan.proposalSafety}`);
      if (plan.priceSource) {
        console.log(`   Price Source: ${plan.priceSource}`);
      }
    }
    console.log("");
  });
}

function printSummaryList(label, items) {
  console.log(`${label}:`);
  if (items.length === 0) {
    console.log("- None");
    return;
  }
  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function printPricingProposalPreview(currentPlans, extracted) {
  const proposedPlans = proposedPricingPlans(extracted, currentPlans);

  console.log("");
  console.log("PRICING[] PROPOSAL PREVIEW");
  console.log("");
  console.log("CURRENT pricing[]");
  console.log("");
  printPlanList(currentPlans);

  console.log("PROPOSED pricing[]");
  console.log("");
  printPlanList(proposedPlans, true);

  console.log("CHANGE SUMMARY");
  console.log("");
  if (proposedPlans.length === 0) {
    console.log("No pricing[] proposal generated because no verified Full Pricing Plans are available.");
    console.log("Needs review:");
    console.log("- Pricing plan extraction appears incomplete.");
    return;
  }

  const summary = pricingProposalSummary(currentPlans, proposedPlans, extracted);
  printSummaryList("Plans added", summary.added);
  printSummaryList("Plans removed/replaced", summary.removed);
  printSummaryList("Plans changed", summary.changed);
  printSummaryList("Plans unchanged", summary.unchanged);
  printSummaryList("Needs review", summary.needsReview);
}

function pricingApplyCheck(currentPlans, extracted, fetchStatus) {
  const proposedPlans = proposedPricingPlans(extracted, currentPlans);
  const reasons = [];
  const statusFetchStatus = effectiveVerificationFetchStatus(fetchStatus, extracted);
  const summary = pricingProposalSummary(currentPlans, proposedPlans, extracted);

  if (statusFetchStatus !== "OK") {
    reasons.push("Official pricing extraction did not complete successfully.");
  }
  if (subscriptionPlanExtractionIncomplete(extracted.fullPricingPlans)) {
    reasons.push("Subscription extraction incomplete.");
  }
  if (proposedPlans.length === 0) {
    reasons.push("Proposed pricing[] is empty.");
  }
  for (const plan of proposedPlans) {
    if (plan.proposalSafety !== "SAFE") {
      reasons.push(`${plan.plan} requires review.`);
    }
    if (!usefulText(plan.price) || normalizeValue(plan.price) === "not explicitly verified") {
      reasons.push(`${plan.plan} has no explicitly verified price.`);
    }
  }
  if (extracted.localeSpecific) {
    reasons.push("Locale-specific pricing requires review.");
  }
  if (extracted.sourceScopeStatus === "PRODUCT_SPECIFIC") {
    reasons.push("Product-specific source scope requires review.");
  }
  if (summary.needsReview.length > 0) {
    reasons.push(...summary.needsReview);
  }

  return {
    eligible: reasons.length === 0,
    reasons: unique(reasons),
    proposedPlans,
  };
}

function writeablePricingPlans(proposedPlans) {
  return proposedPlans.map((plan) => ({
    plan: plan.plan,
    price: plan.price,
    details: plan.details,
  }));
}

function printPricingApplyCheck(tool, currentPlans, check) {
  console.log("");
  console.log("PRICING[] APPLY CHECK");
  console.log("");
  console.log(`Tool: ${tool.name}`);
  console.log(`Eligibility: ${check.eligible ? "ELIGIBLE" : "BLOCKED"}`);
  console.log("");

  if (!check.eligible) {
    console.log("Blocked reasons:");
    for (const reason of check.reasons) {
      console.log(`- ${reason}`);
    }
    return;
  }

  console.log("CURRENT pricing[]");
  console.log("");
  printPlanList(currentPlans);
  console.log("PROPOSED pricing[]");
  console.log("");
  printPlanList(check.proposedPlans);
  console.log("APPLY TARGET:");
  console.log("app/tools/toolData.ts");
  console.log("Field:");
  console.log("pricing[]");
}

async function confirmPricingApply() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question("Apply this pricing[] replacement? Type APPLY to continue: ");
    return answer === "APPLY";
  } finally {
    rl.close();
  }
}

async function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit", cwd: process.cwd() });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function validateAfterApply() {
  console.log("");
  console.log("Running post-write validation:");
  console.log("node --check scripts/check-tool-pricing.mjs");
  const checkCode = await runCommand(process.execPath, ["--check", "scripts/check-tool-pricing.mjs"]);
  console.log("npm run build");
  const buildCode = await runCommand("npm", ["run", "build"]);
  if (checkCode !== 0 || buildCode !== 0) {
    process.exitCode = 1;
  }
}

async function maybeApplyPricingPlans(tool, slug, currentPlans, extracted, fetchStatus, shouldApply) {
  if (!shouldApply) return;

  const check = pricingApplyCheck(currentPlans, extracted, fetchStatus);
  printPricingApplyCheck(tool, currentPlans, check);

  if (!check.eligible) {
    return;
  }

  const confirmed = await confirmPricingApply();
  if (!confirmed) {
    console.log("Apply canceled. No files were modified.");
    return;
  }

  await replaceToolPricingArray(slug, writeablePricingPlans(check.proposedPlans));
  console.log("pricing[] replacement applied.");
  await validateAfterApply();
}

function fieldResult(field, current, extracted, fetchStatus) {
  const evidence = combinedEvidence(field, extracted, fetchStatus);
  const statusFetchStatus = effectiveVerificationFetchStatus(fetchStatus, extracted);
  const status = statusFor(field, current[field], extracted[field], extracted, statusFetchStatus);
  return {
    current: current[field],
    verified: extracted[field],
    status,
    safe: safeToUpdate(field, status, extracted[field], evidence, extracted, statusFetchStatus),
    evidence,
  };
}

function hasSourceLevelBlock(extracted, fetchStatus) {
  return hasGlobalSourceLevelBlock(extracted, fetchStatus);
}

function overallStatus(fieldResults, extracted, fetchStatus, sourceStatus) {
  if (sourceStatus === "SOURCE_MISSING") return "SOURCE_MISSING";
  if (fetchStatus !== "OK") return "ERROR";
  if (hasSourceLevelBlock(extracted, fetchStatus)) return "REVIEW";

  const usefulFields = COMPARED_FIELDS.filter((field) => extracted[field] !== null || fieldResults[field].current !== null);
  const verifiedCount = usefulFields.filter((field) => ["MATCH", "CHANGE"].includes(fieldResults[field].status)).length;
  const reviewCount = usefulFields.filter((field) => fieldResults[field].status === "REVIEW").length;
  const hasFieldAmbiguity = COMPARED_FIELDS.some((field) => extracted.fieldAmbiguity?.[field]);

  if (hasFieldAmbiguity) return verifiedCount > 0 ? "PARTIAL" : "REVIEW";
  if (verifiedCount === 0) return "REVIEW";
  if (reviewCount > 0) return "PARTIAL";
  return "VERIFIED";
}

function toolSafeToAutoApply(fieldResults, extracted, fetchStatus, status) {
  const hasSafeField = COMPARED_FIELDS.some((field) => fieldResults[field].safe === "YES");
  const hasReviewField = COMPARED_FIELDS.some((field) => fieldResults[field].status === "REVIEW");
  const hasUnsafeChangedField = COMPARED_FIELDS.some((field) => fieldResults[field].status === "CHANGE" && fieldResults[field].safe !== "YES");
  const hasFieldAmbiguity = COMPARED_FIELDS.some((field) => extracted.fieldAmbiguity?.[field]);
  const hasUnresolvedVerifiedValue = COMPARED_FIELDS.some((field) => fieldResults[field].status === "REVIEW" && fieldResults[field].verified === null);

  return hasSafeField &&
    fetchStatus === "OK" &&
    status === "VERIFIED" &&
    !hasReviewField &&
    !hasUnsafeChangedField &&
    !hasFieldAmbiguity &&
    !hasUnresolvedVerifiedValue &&
    !hasSourceLevelBlock(extracted, fetchStatus)
    ? "YES"
    : "NO";
}

function checkedAtIso() {
  return new Date().toISOString();
}

function categoryLabel(profile) {
  return Array.isArray(profile.categories) ? profile.categories.join("; ") : "";
}

function notesForTool(fieldResults, extracted, fetchStatus, sourceResolution) {
  const notes = [];
  if (sourceResolution.note) notes.push(sourceResolution.note);
  if (fetchStatus !== "OK" && extracted.fetchError) notes.push(extracted.fetchError);
  if (extracted.localeSpecific && extracted.localeEvidence) notes.push(`Locale: ${extracted.localeEvidence}`);
  if (extracted.noPricingPublished && extracted.noPricingPublishedEvidence) notes.push(`No published pricing: ${extracted.noPricingPublishedEvidence}`);
  for (const field of COMPARED_FIELDS) {
    if (fieldResults[field].evidence) {
      notes.push(`${FIELD_LABELS[field]}: ${fieldResults[field].evidence}`);
    }
  }
  return notes.join(" ");
}

function compactDisplay(value, fallback = "Not verified") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function isGenericCurrentPrice(value) {
  const normalized = normalizeValue(value);
  return (
    normalized === "" ||
    normalized === "unknown" ||
    normalized === "not present" ||
    normalized === "not verified" ||
    normalized === "paid plan" ||
    normalized === "paid plans" ||
    normalized === "varies" ||
    normalized === "contact sales" ||
    normalized === "custom" ||
    normalized === "custom pricing"
  );
}

function priceChangeForRow(fields, rowDraft, extracted, fetchStatus, sourceResolution) {
  const current = fields.startingPrice.current;
  const verified = fields.startingPrice.verified;

  if (fetchStatus !== "OK" || sourceResolution.sourceStatus === "SOURCE_MISSING") return "ERROR";
  if (fieldHasSafetyBlock("startingPrice", extracted) || fields.startingPrice.status === "REVIEW") return "REVIEW";
  if (verified === null) return "UNVERIFIED";
  if (current === null || isGenericCurrentPrice(current)) return "NEWLY VERIFIED";
  return valuesMateriallyMatch(current, verified) ? "NO CHANGE" : "CHANGED";
}

function truncateSummary(value) {
  if (value.length <= 120) return value;
  return `${value.slice(0, 117).trim()}...`;
}

function changeSummaryForRow(fields, rowDraft, extracted, fetchStatus, sourceResolution, priceChange) {
  if (sourceResolution.sourceStatus === "SOURCE_MISSING") return "Official pricing source not found";
  if (fetchStatus !== "OK") return rowDraft.fetchMethod === "PLAYWRIGHT" ? "Browser could not verify pricing" : "Pricing source could not be verified";
  if (fieldHasProductScopeBlock("startingPrice", extracted)) return "Product-specific source; manual review required";
  if (fieldHasLocaleBlock("startingPrice", extracted)) return "Region-specific pricing; manual review required";
  if (extracted.fieldAmbiguity?.startingPrice) return "Pricing ambiguity; manual review required";
  if (priceChange === "UNVERIFIED") return "No reliable current pricing verified";
  if (priceChange === "NO CHANGE") return "No material pricing change";

  const current = compactDisplay(fields.startingPrice.current, "Unknown");
  const verified = compactDisplay(fields.startingPrice.verified, "Not verified");
  const annual = fields.annualBilling.verified;
  const monthly = fields.monthlyBilling.verified;

  if (annual && monthly) return truncateSummary(`${current} -> ${annual}; ${monthly}`);
  if (verified && current !== verified) return truncateSummary(`${current} -> ${verified}`);
  if (priceChange === "NEWLY VERIFIED") return truncateSummary(`Unknown -> ${verified}`);
  return truncateSummary(`${current} -> ${verified}`);
}

function reportRow(profile, sourceResolution, finalSourceUrl, current, extracted, fetchStatus, fetchMethod, checkedAt) {
  const statusFetchStatus = effectiveVerificationFetchStatus(fetchStatus, extracted);
  const fields = Object.fromEntries(
    COMPARED_FIELDS.map((field) => [field, fieldResult(field, current, extracted, fetchStatus)]),
  );
  const status = overallStatus(fields, extracted, statusFetchStatus, sourceResolution.sourceStatus);
  const safe = toolSafeToAutoApply(fields, extracted, statusFetchStatus, status);
  const rowDraft = { fetchMethod };
  const priceChange = priceChangeForRow(fields, rowDraft, extracted, statusFetchStatus, sourceResolution);
  const changeSummary = changeSummaryForRow(fields, rowDraft, extracted, statusFetchStatus, sourceResolution, priceChange);

  return {
    category: categoryLabel(profile),
    tool: profile.name,
    slug: profile.slug,
    website: profile.websiteUrl ?? "",
    requestedPricingSource: sourceResolution.requestedSourceUrl ?? "",
    finalPricingSource: finalSourceUrl ?? sourceResolution.finalSourceUrl ?? "",
    sourceStatus: sourceResolution.sourceStatus,
    sourceScopeStatus: extracted.sourceScopeStatus ?? "UNKNOWN",
    localePricingStatus: localePricingStatus(statusFetchStatus, extracted),
    fetchStatus,
    fetchMethod,
    currentFreePlan: displayCurrent(fields.freePlan.current),
    verifiedFreePlan: displayVerified(fields.freePlan.verified),
    freePlanStatus: fields.freePlan.status,
    freePlanSafe: fields.freePlan.safe,
    currentStartingPrice: displayCurrent(fields.startingPrice.current),
    verifiedStartingPrice: displayVerified(fields.startingPrice.verified),
    startingPriceStatus: fields.startingPrice.status,
    startingPriceSafe: fields.startingPrice.safe,
    currentAnnualBilling: displayCurrent(fields.annualBilling.current),
    verifiedAnnualBilling: displayVerified(fields.annualBilling.verified),
    annualBillingStatus: fields.annualBilling.status,
    annualBillingSafe: fields.annualBilling.safe,
    currentMonthlyBilling: displayCurrent(fields.monthlyBilling.current),
    verifiedMonthlyBilling: displayVerified(fields.monthlyBilling.verified),
    monthlyBillingStatus: fields.monthlyBilling.status,
    monthlyBillingSafe: fields.monthlyBilling.safe,
    currentTeamPlan: displayCurrent(fields.teamPlan.current),
    verifiedTeamPlan: displayVerified(fields.teamPlan.verified),
    teamPlanStatus: fields.teamPlan.status,
    teamPlanSafe: fields.teamPlan.safe,
    currentEnterprisePlan: displayCurrent(fields.enterprisePlan.current),
    verifiedEnterprisePlan: displayVerified(fields.enterprisePlan.verified),
    enterprisePlanStatus: fields.enterprisePlan.status,
    enterprisePlanSafe: fields.enterprisePlan.safe,
    currentPricingVerified: current.pricingVerified ?? "Not present",
    checkedAt,
    overallStatus: status,
    toolSafeToAutoApply: safe,
    priceChange,
    changeSummary,
    currentPrice: displayCurrent(fields.startingPrice.current),
    verifiedPrice: displayVerified(fields.startingPrice.verified),
    annual: displayVerified(fields.annualBilling.verified),
    monthly: displayVerified(fields.monthlyBilling.verified),
    team: displayVerified(fields.teamPlan.verified),
    enterprise: displayVerified(fields.enterprisePlan.verified),
    evidenceNotes: notesForTool(fields, extracted, fetchStatus, sourceResolution),
    fields,
    extracted,
    currentPricingPlans: Array.isArray(profile.pricing) ? profile.pricing : [],
  };
}

async function runSingleProfileCheck(profile) {
  const current = currentPricingFromProfile(profile);
  const sourceResolution = await discoverPricingSource(profile);

  if (sourceResolution.sourceStatus === "SOURCE_MISSING") {
    const extracted = normalizeExtractionForReport(emptyExtraction(sourceResolution.note), "UNKNOWN");
    return reportRow(profile, sourceResolution, null, current, extracted, "ERROR", "NONE", checkedAtIso());
  }

  const tool = {
    name: profile.name,
    sourceUrl: sourceResolution.requestedSourceUrl,
  };

  let fetched;
  try {
    fetched = await fetchPricingPage(sourceResolution.requestedSourceUrl);
  } catch (error) {
    const extracted = await extractionAfterPrimaryFailure(
      profile.slug,
      tool,
      error instanceof Error ? error.message : String(error),
      "UNKNOWN",
      sourceResolution.requestedSourceUrl,
    );
    return reportRow(profile, sourceResolution, "Unavailable", current, extracted, "ERROR", "HTTP", checkedAtIso());
  }

  if (fetched.fetchStatus === "ERROR") {
    const sourceScope = sourceScopeStatus(tool, sourceResolution.requestedSourceUrl, fetched.finalUrl, fetched.fetchStatus);
    const extracted = await extractionAfterPrimaryFailure(
      profile.slug,
      tool,
      fetched.errorMessage,
      sourceScope,
      sourceResolution.requestedSourceUrl,
    );
    return reportRow(profile, sourceResolution, fetched.finalUrl, current, extracted, fetched.fetchStatus, fetched.fetchMethod, checkedAtIso());
  }

  try {
    let extracted = await extractPricingWithOpenAI(tool, fetched.text, sourceResolution.requestedSourceUrl, fetched.finalUrl);
    let sourceScope = sourceScopeStatus(tool, sourceResolution.requestedSourceUrl, fetched.finalUrl, fetched.fetchStatus);

    if (shouldRetryWithPlaywrightAfterExtraction(fetched, extracted)) {
      const browserFetched = await fetchPricingPageWithPlaywright(sourceResolution.requestedSourceUrl, fetched.finalUrl, null);
      if (browserFetched.fetchStatus === "ERROR") {
        sourceScope = sourceScopeStatus(tool, sourceResolution.requestedSourceUrl, browserFetched.finalUrl, browserFetched.fetchStatus);
        extracted = await extractionAfterPrimaryFailure(
          profile.slug,
          tool,
          browserFetched.errorMessage,
          sourceScope,
          sourceResolution.requestedSourceUrl,
        );
        return reportRow(profile, sourceResolution, browserFetched.finalUrl, current, extracted, browserFetched.fetchStatus, browserFetched.fetchMethod, checkedAtIso());
      }

      fetched = browserFetched;
      extracted = await extractPricingWithOpenAI(tool, fetched.text, sourceResolution.requestedSourceUrl, fetched.finalUrl);
      sourceScope = sourceScopeStatus(tool, sourceResolution.requestedSourceUrl, fetched.finalUrl, fetched.fetchStatus);
    }

    extracted = normalizeExtractionForReport(extracted, sourceScope);
    const fallbackResult = await applySecondarySourceFallback(profile.slug, tool, extracted, fetched.fetchStatus, sourceResolution.requestedSourceUrl);

    return reportRow(
      profile,
      sourceResolution,
      fetched.finalUrl,
      current,
      fallbackResult.extracted,
      fetched.fetchStatus,
      fetched.fetchMethod,
      checkedAtIso(),
    );
  } catch (error) {
    const extracted = await extractionAfterPrimaryFailure(
      profile.slug,
      tool,
      error instanceof Error ? error.message : String(error),
      "UNKNOWN",
      sourceResolution.requestedSourceUrl,
    );
    return reportRow(profile, sourceResolution, fetched.finalUrl, current, extracted, "ERROR", fetched.fetchMethod, checkedAtIso());
  }
}

const CSV_COLUMNS = [
  ["Category", "category"],
  ["Tool", "tool"],
  ["Slug", "slug"],
  ["Website", "website"],
  ["Requested Pricing Source", "requestedPricingSource"],
  ["Final Pricing Source", "finalPricingSource"],
  ["Source Status", "sourceStatus"],
  ["Source Scope Status", "sourceScopeStatus"],
  ["Locale Pricing Status", "localePricingStatus"],
  ["Fetch Status", "fetchStatus"],
  ["Fetch Method", "fetchMethod"],
  ["Current Free Plan", "currentFreePlan"],
  ["Verified Free Plan", "verifiedFreePlan"],
  ["Free Plan Status", "freePlanStatus"],
  ["Free Plan Safe", "freePlanSafe"],
  ["Current Starting Price", "currentStartingPrice"],
  ["Verified Starting Price", "verifiedStartingPrice"],
  ["Starting Price Status", "startingPriceStatus"],
  ["Starting Price Safe", "startingPriceSafe"],
  ["Verified Annual Billing", "verifiedAnnualBilling"],
  ["Annual Billing Status", "annualBillingStatus"],
  ["Annual Billing Safe", "annualBillingSafe"],
  ["Verified Monthly Billing", "verifiedMonthlyBilling"],
  ["Monthly Billing Status", "monthlyBillingStatus"],
  ["Monthly Billing Safe", "monthlyBillingSafe"],
  ["Current Team / Business Plan", "currentTeamPlan"],
  ["Verified Team / Business Plan", "verifiedTeamPlan"],
  ["Team / Business Plan Status", "teamPlanStatus"],
  ["Team / Business Plan Safe", "teamPlanSafe"],
  ["Current Enterprise Plan", "currentEnterprisePlan"],
  ["Verified Enterprise Plan", "verifiedEnterprisePlan"],
  ["Enterprise Plan Status", "enterprisePlanStatus"],
  ["Enterprise Plan Safe", "enterprisePlanSafe"],
  ["Current Pricing Verified", "currentPricingVerified"],
  ["Checked At", "checkedAt"],
  ["Overall Status", "overallStatus"],
  ["Tool Safe to Auto Apply", "toolSafeToAutoApply"],
  ["Evidence / Notes", "evidenceNotes"],
];

const SHEET_COLUMNS = [
  ["Tool", "tool"],
  ["Category", "category"],
  ["Overall Status", "overallStatus"],
  ["Safe to Auto Apply", "toolSafeToAutoApply"],
  ["Price Change", "priceChange"],
  ["Change Summary", "changeSummary"],
  ["Current Price", "currentPrice"],
  ["Verified Price", "verifiedPrice"],
  ["Annual", "annual"],
  ["Monthly", "monthly"],
  ["Team / Business", "team"],
  ["Enterprise", "enterprise"],
  ["Requested Pricing Source", "requestedPricingSource"],
  ["Final Pricing Source", "finalPricingSource"],
  ["Fetch Method", "fetchMethod"],
  ["Source Scope", "sourceScopeStatus"],
  ["Checked At", "checkedAt"],
  ["Evidence / Notes", "evidenceNotes"],
];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function rowsToCsv(rows) {
  const header = CSV_COLUMNS.map(([label]) => csvEscape(label)).join(",");
  const body = rows.map((row) => CSV_COLUMNS.map(([, key]) => csvEscape(row[key])).join(","));
  return [header, ...body].join("\n");
}

async function writeReports(rows) {
  const reportsDir = path.join(process.cwd(), REPORTS_DIR);
  await fs.mkdir(reportsDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const csvPath = path.join(reportsDir, `softbade-pricing-audit-${date}.csv`);
  const jsonPath = path.join(reportsDir, `softbade-pricing-audit-${date}.json`);
  const summary = summarizeRows(rows);

  await fs.writeFile(csvPath, rowsToCsv(rows), "utf8");
  await fs.writeFile(jsonPath, JSON.stringify({ generatedAt: checkedAtIso(), summary, tools: rows }, null, 2), "utf8");

  return { csvPath, jsonPath, summary };
}

function summarizeRows(rows) {
  const byStatus = Object.fromEntries(["VERIFIED", "PARTIAL", "REVIEW", "ERROR", "SOURCE_MISSING"].map((status) => [status, 0]));
  const byFetchMethod = { HTTP: 0, PLAYWRIGHT: 0 };

  for (const row of rows) {
    byStatus[row.overallStatus] = (byStatus[row.overallStatus] ?? 0) + 1;
    if (row.fetchMethod === "HTTP" || row.fetchMethod === "PLAYWRIGHT") {
      byFetchMethod[row.fetchMethod] += 1;
    }
  }

  return {
    toolsChecked: rows.length,
    ...byStatus,
    toolsSafeToAutoApply: rows.filter((row) => row.toolSafeToAutoApply === "YES").length,
    HTTP: byFetchMethod.HTTP,
    PLAYWRIGHT: byFetchMethod.PLAYWRIGHT,
  };
}

function printBatchSummary(reportPaths) {
  const { summary, csvPath, jsonPath } = reportPaths;

  console.log("Softbade Pricing Audit");
  console.log("");
  console.log(`Tools checked: ${summary.toolsChecked}`);
  console.log("");
  console.log(`VERIFIED: ${summary.VERIFIED}`);
  console.log(`PARTIAL: ${summary.PARTIAL}`);
  console.log(`REVIEW: ${summary.REVIEW}`);
  console.log(`ERROR: ${summary.ERROR}`);
  console.log(`SOURCE_MISSING: ${summary.SOURCE_MISSING}`);
  console.log("");
  console.log(`Tools Safe to Auto Apply: ${summary.toolsSafeToAutoApply}`);
  console.log("");
  console.log(`HTTP: ${summary.HTTP}`);
  console.log(`PLAYWRIGHT: ${summary.PLAYWRIGHT}`);
  console.log("");
  console.log(`CSV: ${path.relative(process.cwd(), csvPath)}`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);
  if (reportPaths.spreadsheetUrl) {
    console.log(`Sheet: ${reportPaths.spreadsheetUrl}`);
    console.log(`Audit tab: ${reportPaths.auditTabName}`);
  }
}

function requireGoogleCredentials() {
  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`--sheet requires ${missing.join(", ")}. Credentials were not printed or stored.`);
  }
}

function googleSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

async function readSheetConfig() {
  try {
    const configText = await fs.readFile(path.join(process.cwd(), SHEET_CONFIG_PATH), "utf8");
    const config = JSON.parse(configText);
    if (config?.spreadsheetId) return config;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return null;
}

async function writeSheetConfig(config) {
  const reportsDir = path.join(process.cwd(), REPORTS_DIR);
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(
    path.join(process.cwd(), SHEET_CONFIG_PATH),
    JSON.stringify({
      spreadsheetId: config.spreadsheetId,
      spreadsheetUrl: config.spreadsheetUrl,
    }, null, 2),
    "utf8",
  );
}

function spreadsheetUrl(spreadsheetId) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

async function resolveSpreadsheet(sheets) {
  const existing = await readSheetConfig();
  if (existing?.spreadsheetId) {
    return {
      spreadsheetId: existing.spreadsheetId,
      spreadsheetUrl: existing.spreadsheetUrl || spreadsheetUrl(existing.spreadsheetId),
    };
  }

  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_TITLE },
      sheets: [{ properties: { title: SUMMARY_TAB } }],
    },
    fields: "spreadsheetId,spreadsheetUrl",
  });

  const config = {
    spreadsheetId: response.data.spreadsheetId,
    spreadsheetUrl: response.data.spreadsheetUrl || spreadsheetUrl(response.data.spreadsheetId),
  };
  await writeSheetConfig(config);
  return config;
}

function timestampTabBaseName(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}-${minutes}`;
}

function nextAuditTabName(existingTitles) {
  const baseName = timestampTabBaseName();
  if (!existingTitles.has(baseName)) return baseName;

  let suffix = 2;
  while (existingTitles.has(`${baseName} (${suffix})`)) {
    suffix += 1;
  }
  return `${baseName} (${suffix})`;
}

async function ensureSummaryAndCreateAuditTab(sheets, spreadsheetId) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const sheetProperties = response.data.sheets?.map((sheet) => sheet.properties) ?? [];
  const byTitle = new Map(sheetProperties.map((properties) => [properties.title, properties]));
  const auditTabName = nextAuditTabName(new Set(byTitle.keys()));
  const requests = [];

  if (!byTitle.has(SUMMARY_TAB)) {
    requests.push({ addSheet: { properties: { title: SUMMARY_TAB } } });
  }

  requests.push({ addSheet: { properties: { title: auditTabName } } });

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  const refreshed = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const sheetIds = new Map((refreshed.data.sheets ?? []).map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
  return { sheetIds, auditTabName };
}

function sheetValues(rows) {
  return [
    SHEET_COLUMNS.map(([label]) => label),
    ...rows.map((row) => SHEET_COLUMNS.map(([, key]) => row[key] ?? "")),
  ];
}

function attentionReason(row) {
  if (row.sourceStatus === "SOURCE_MISSING") return "Official pricing source not found";
  if (row.fetchMethod === "PLAYWRIGHT") return "Browser could not verify pricing";
  if (row.fetchStatus === "ERROR") return "Pricing source could not be verified";
  return "Verification failed";
}

function reviewReason(row) {
  if (row.sourceScopeStatus === "PRODUCT_SPECIFIC") return "PRODUCT_SPECIFIC";
  if (row.localePricingStatus === "REGION_SPECIFIC") return "REGION_SPECIFIC";
  if (row.evidenceNotes.includes("Pricing ambiguity")) return "Pricing ambiguity";
  if (row.evidenceNotes.includes("Complex product pricing")) return "Pricing ambiguity";
  return "Manual review required";
}

function sectionRows(title, rows, columns, mapper) {
  return [
    ["", "", "", ""],
    [title, "", "", ""],
    columns,
    ...rows.map(mapper),
  ];
}

function summaryValues(rows, summary, runType) {
  const checkedAt = rows[0]?.checkedAt ?? checkedAtIso();
  const sourceScopeTotals = {
    PRODUCT_SPECIFIC: rows.filter((row) => row.sourceScopeStatus === "PRODUCT_SPECIFIC").length,
    REGION_SPECIFIC: rows.filter((row) => row.localePricingStatus === "REGION_SPECIFIC").length,
  };
  const categoryTotals = [
    "AI & Automation",
    "Marketing & SEO",
    "Productivity",
    "CRM & Sales",
    "Design & Creative",
    "Finance Tools",
  ].map((category) => [category, rows.filter((row) => row.category.split("; ").includes(category)).length]);
  const errorRows = rows.filter((row) => row.overallStatus === "ERROR");
  const missingRows = rows.filter((row) => row.overallStatus === "SOURCE_MISSING");
  const reviewRows = rows.filter((row) =>
    row.overallStatus === "REVIEW" ||
    row.sourceScopeStatus === "PRODUCT_SPECIFIC" ||
    row.localePricingStatus === "REGION_SPECIFIC"
  );
  const changedRows = rows.filter((row) => row.priceChange === "CHANGED" || row.priceChange === "NEWLY VERIFIED");

  return [
    ["Softbade Pricing Audit", "", "", ""],
    ["Checked At", checkedAt, "", ""],
    ["Run Type", runType, "", ""],
    ["Total Tools", summary.toolsChecked, "", ""],
    ["", "", "", ""],
    ["VERIFIED", summary.VERIFIED, "", ""],
    ["PARTIAL", summary.PARTIAL, "", ""],
    ["REVIEW", summary.REVIEW, "", ""],
    ["ERROR", summary.ERROR, "", ""],
    ["SOURCE_MISSING", summary.SOURCE_MISSING, "", ""],
    ["", "", "", ""],
    ["Tools Safe to Auto Apply", summary.toolsSafeToAutoApply, "", ""],
    ["HTTP", summary.HTTP, "", ""],
    ["PLAYWRIGHT", summary.PLAYWRIGHT, "", ""],
    ["", "", "", ""],
    ["PRODUCT_SPECIFIC", sourceScopeTotals.PRODUCT_SPECIFIC, "", ""],
    ["REGION_SPECIFIC", sourceScopeTotals.REGION_SPECIFIC, "", ""],
    ["", "", "", ""],
    ["Category Totals", "", "", ""],
    ...categoryTotals.map(([category, count]) => [category, count, "", ""]),
    ...sectionRows(`NEEDS ATTENTION - ERROR (${errorRows.length})`, errorRows, ["Tool", "Reason", "", ""], (row) => [row.tool, attentionReason(row), "", ""]),
    ...sectionRows(`NEEDS ATTENTION - SOURCE MISSING (${missingRows.length})`, missingRows, ["Tool", "Reason", "", ""], (row) => [row.tool, attentionReason(row), "", ""]),
    ...sectionRows("MANUAL REVIEW", reviewRows, ["Tool", "Reason", "", ""], (row) => [row.tool, reviewReason(row), "", ""]),
    ...sectionRows("PRICE CHANGES", changedRows, ["Tool", "Price Change", "Change Summary", "Safe to Auto Apply"], (row) => [
      row.tool,
      row.priceChange,
      row.changeSummary,
      row.toolSafeToAutoApply,
    ]),
  ];
}

function formatSheetRequests(sheetIds, auditTabName, rowCount) {
  const auditSheetId = sheetIds.get(auditTabName);
  const summarySheetId = sheetIds.get(SUMMARY_TAB);
  const overallStatusColumnIndex = SHEET_COLUMNS.findIndex(([label]) => label === "Overall Status");
  const priceChangeColumnIndex = SHEET_COLUMNS.findIndex(([label]) => label === "Price Change");
  const safeColumnIndex = SHEET_COLUMNS.findIndex(([label]) => label === "Safe to Auto Apply");

  return [
    {
      updateSheetProperties: {
        properties: {
          sheetId: auditSheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      updateSheetProperties: {
        properties: {
          sheetId: summarySheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: { sheetId: auditSheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    },
    {
      repeatCell: {
        range: { sheetId: summarySheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    },
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId: auditSheetId,
            startRowIndex: 0,
            endRowIndex: Math.max(rowCount + 1, 2),
            startColumnIndex: 0,
            endColumnIndex: SHEET_COLUMNS.length,
          },
        },
      },
    },
    {
      repeatCell: {
        range: { sheetId: auditSheetId },
        cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "MIDDLE" } },
        fields: "userEnteredFormat.wrapStrategy,userEnteredFormat.verticalAlignment",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: auditSheetId, dimension: "COLUMNS", startIndex: 0, endIndex: SHEET_COLUMNS.length },
        properties: { pixelSize: 130 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: auditSheetId, dimension: "COLUMNS", startIndex: 5, endIndex: 6 },
        properties: { pixelSize: 260 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: auditSheetId, dimension: "COLUMNS", startIndex: 12, endIndex: 14 },
        properties: { pixelSize: 250 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: auditSheetId, dimension: "COLUMNS", startIndex: SHEET_COLUMNS.length - 1, endIndex: SHEET_COLUMNS.length },
        properties: { pixelSize: 420 },
        fields: "pixelSize",
      },
    },
    ...conditionalFormatRequests(auditSheetId, overallStatusColumnIndex, priceChangeColumnIndex, safeColumnIndex, Math.max(rowCount + 1, 2)),
  ];
}

function conditionalFormatRequests(sheetId, overallStatusColumnIndex, priceChangeColumnIndex, safeColumnIndex, endRowIndex) {
  const requests = [];
  const colors = {
    positive: { red: 0.85, green: 0.95, blue: 0.86 },
    highlight: { red: 0.82, green: 0.92, blue: 1 },
    warning: { red: 1, green: 0.94, blue: 0.78 },
    review: { red: 1, green: 0.86, blue: 0.68 },
    error: { red: 0.98, green: 0.82, blue: 0.82 },
    darkWarning: { red: 0.92, green: 0.72, blue: 0.72 },
  };

  for (const [text, color] of [
    ["VERIFIED", colors.positive],
    ["PARTIAL", colors.warning],
    ["REVIEW", colors.review],
    ["ERROR", colors.error],
    ["SOURCE_MISSING", colors.darkWarning],
  ]) {
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, endRowIndex, startColumnIndex: overallStatusColumnIndex, endColumnIndex: overallStatusColumnIndex + 1 }],
          booleanRule: {
            condition: { type: "TEXT_EQ", values: [{ userEnteredValue: text }] },
            format: { backgroundColor: color },
          },
        },
        index: 0,
      },
    });
  }

  for (const [text, color] of [
    ["CHANGED", colors.highlight],
    ["NEWLY VERIFIED", colors.highlight],
    ["REVIEW", colors.warning],
    ["ERROR", colors.error],
    ["UNVERIFIED", colors.error],
  ]) {
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: 1, endRowIndex, startColumnIndex: priceChangeColumnIndex, endColumnIndex: priceChangeColumnIndex + 1 }],
          booleanRule: {
            condition: { type: "TEXT_EQ", values: [{ userEnteredValue: text }] },
            format: { backgroundColor: color },
          },
        },
        index: 0,
      },
    });
  }

  requests.push({
    addConditionalFormatRule: {
      rule: {
        ranges: [{ sheetId, startRowIndex: 1, endRowIndex, startColumnIndex: safeColumnIndex, endColumnIndex: safeColumnIndex + 1 }],
        booleanRule: {
          condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "YES" }] },
          format: { backgroundColor: colors.positive },
        },
      },
      index: 0,
    },
  });

  return requests;
}

async function syncSheet(rows, summary, runType) {
  requireGoogleCredentials();
  const sheets = googleSheetsClient();
  const spreadsheet = await resolveSpreadsheet(sheets);
  const { sheetIds, auditTabName } = await ensureSummaryAndCreateAuditTab(sheets, spreadsheet.spreadsheetId);

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: spreadsheet.spreadsheetId,
    requestBody: {
      ranges: [`'${SUMMARY_TAB}'`],
    },
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheet.spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `'${auditTabName}'!A1`, values: sheetValues(rows) },
        { range: `'${SUMMARY_TAB}'!A1`, values: summaryValues(rows, summary, runType) },
      ],
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheet.spreadsheetId,
    requestBody: { requests: formatSheetRequests(sheetIds, auditTabName, rows.length) },
  });

  return { ...spreadsheet, auditTabName };
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

function parseLimit(args) {
  const limitIndex = args.indexOf("--limit");
  if (limitIndex === -1) return null;

  const value = Number.parseInt(args[limitIndex + 1], 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("--limit must be followed by a positive integer");
  }
  return value;
}

function hasSheetFlag(args) {
  return args.includes("--sheet");
}

async function runBatch(args) {
  const shouldSyncSheet = hasSheetFlag(args);
  if (shouldSyncSheet) {
    requireGoogleCredentials();
  }

  if (!process.env.OPENAI_API_KEY) {
    fail("OPENAI_API_KEY is required to run the batch pricing audit. The key was not printed or used.");
    return;
  }

  const limit = parseLimit(args);
  const profiles = await loadToolProfiles();
  const selectedProfiles = limit ? profiles.slice(0, limit) : profiles;

  const rows = await mapWithConcurrency(selectedProfiles, 3, async (profile, index) => {
    console.error(`[${index + 1}/${selectedProfiles.length}] Checking ${profile.name} (${profile.slug})`);
    try {
      return await runSingleProfileCheck(profile);
    } catch (error) {
      const current = currentPricingFromProfile(profile);
      const sourceResolution = {
        sourceStatus: "ERROR",
        requestedSourceUrl: "",
        finalSourceUrl: "",
        note: error instanceof Error ? error.message : String(error),
      };
      const extracted = normalizeExtractionForReport(emptyExtraction(sourceResolution.note), "UNKNOWN");
      return reportRow(profile, sourceResolution, "", current, extracted, "ERROR", "NONE", checkedAtIso());
    }
  });

  const reportPaths = await writeReports(rows);
  if (shouldSyncSheet) {
    const runType = limit ? `LIMIT ${limit}` : "FULL";
    const spreadsheet = await syncSheet(rows, reportPaths.summary, runType);
    reportPaths.spreadsheetUrl = spreadsheet.spreadsheetUrl;
    reportPaths.auditTabName = spreadsheet.auditTabName;
  }
  printBatchSummary(reportPaths);
}

function eligibilityReasonBucket(reason) {
  const normalized = normalizeValue(reason);
  if (/incomplete/.test(normalized)) return "incomplete extraction";
  if (/locale|region/.test(normalized)) return "locale/region review";
  if (/product-specific|product scope/.test(normalized)) return "product-scope review";
  if (/no explicitly verified price|unresolved price|not explicitly verified/.test(normalized)) return "unresolved proposed price";
  if (/requires review|manual review/.test(normalized)) return "proposal REVIEW";
  if (/conflict|disagree/.test(normalized)) return "source conflict";
  if (/empty/.test(normalized)) return "empty proposal";
  return "other";
}

function conciseEligibilityReason(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) return "None";
  return reasons.slice(0, 2).join("; ");
}

function pricingEligibilityScanRow(row) {
  const check = pricingApplyCheck(row.currentPricingPlans ?? [], row.extracted, row.fetchStatus);
  const proposedPlans = check.proposedPlans ?? [];
  const safePlans = proposedPlans.filter((plan) => plan.proposalSafety === "SAFE").length;
  const reviewPlans = proposedPlans.filter((plan) => plan.proposalSafety === "REVIEW").length;

  return {
    tool: row.tool,
    slug: row.slug,
    eligibility: check.eligible ? "ELIGIBLE" : "BLOCKED",
    reasons: check.reasons,
    proposedCount: proposedPlans.length,
    safePlans,
    reviewPlans,
    sourceScopeStatus: row.sourceScopeStatus,
    localePricingStatus: row.localePricingStatus,
    fetchStatus: row.fetchStatus,
    fetchMethod: row.fetchMethod,
  };
}

function printPricingEligibilityTool(scanRow) {
  console.log(`${scanRow.slug} — ${scanRow.tool}`);
  console.log(`pricing[] eligibility: ${scanRow.eligibility}`);
  if (scanRow.eligibility === "BLOCKED") {
    console.log(`Blocked reasons: ${conciseEligibilityReason(scanRow.reasons)}`);
  }
  console.log(`Proposed subscription plans: ${scanRow.proposedCount}`);
  console.log(`SAFE plans: ${scanRow.safePlans}`);
  console.log(`REVIEW plans: ${scanRow.reviewPlans}`);
  console.log(`Source scope: ${scanRow.sourceScopeStatus}`);
  console.log(`Locale status: ${scanRow.localePricingStatus}`);
  console.log(`Fetch: ${scanRow.fetchMethod}/${scanRow.fetchStatus}`);
  console.log("");
}

function printPricingEligibilitySummary(scanRows) {
  const eligibleRows = scanRows.filter((row) => row.eligibility === "ELIGIBLE");
  const blockedRows = scanRows.filter((row) => row.eligibility === "BLOCKED");
  const buckets = {
    "incomplete extraction": 0,
    "locale/region review": 0,
    "product-scope review": 0,
    "unresolved proposed price": 0,
    "proposal REVIEW": 0,
    "source conflict": 0,
    "empty proposal": 0,
    other: 0,
  };

  for (const row of blockedRows) {
    const bucketNames = unique((row.reasons.length > 0 ? row.reasons : ["other"]).map(eligibilityReasonBucket));
    for (const bucketName of bucketNames) {
      buckets[bucketName] += 1;
    }
  }

  console.log("PRICING[] ELIGIBILITY SUMMARY");
  console.log("");
  console.log(`Total tools: ${scanRows.length}`);
  console.log(`Eligible: ${eligibleRows.length}`);
  console.log(`Blocked: ${blockedRows.length}`);
  console.log("");
  console.log("Blocked by reason:");
  for (const [reason, count] of Object.entries(buckets)) {
    console.log(`- ${reason}: ${count}`);
  }
  console.log("");
  console.log("ELIGIBLE TOOLS");
  if (eligibleRows.length === 0) {
    console.log("- None");
  } else {
    for (const row of eligibleRows) {
      console.log(`- ${row.slug} — ${row.tool}`);
    }
  }
  console.log("");
  console.log("BLOCKED TOOLS");
  if (blockedRows.length === 0) {
    console.log("- None");
  } else {
    for (const row of blockedRows) {
      console.log(`- ${row.slug} — ${row.tool} — ${conciseEligibilityReason(row.reasons)}`);
    }
  }
}

async function runPricingEligibilityBatch(args) {
  if (args.includes("--apply")) {
    fail("--apply is not allowed with --pricing-eligibility-all.");
    return;
  }
  const allowedArgs = new Set(["--pricing-eligibility-all", "--limit"]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--limit") {
      index += 1;
      continue;
    }
    if (!allowedArgs.has(arg)) {
      usage();
      process.exitCode = 1;
      return;
    }
  }
  if (!process.env.OPENAI_API_KEY) {
    fail("OPENAI_API_KEY is required to run the pricing[] eligibility scan. The key was not printed or used.");
    return;
  }

  const limit = parseLimit(args);
  const profiles = await loadToolProfiles();
  const selectedProfiles = limit ? profiles.slice(0, limit) : profiles;

  const scanRows = await mapWithConcurrency(selectedProfiles, 3, async (profile, index) => {
    console.error(`[${index + 1}/${selectedProfiles.length}] Checking ${profile.name} (${profile.slug})`);
    try {
      return pricingEligibilityScanRow(await runSingleProfileCheck(profile));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        tool: profile.name,
        slug: profile.slug,
        eligibility: "BLOCKED",
        reasons: [`error: ${message}`],
        proposedCount: 0,
        safePlans: 0,
        reviewPlans: 0,
        sourceScopeStatus: "UNKNOWN",
        localePricingStatus: "UNKNOWN",
        fetchStatus: "ERROR",
        fetchMethod: "NONE",
      };
    }
  });

  for (const scanRow of scanRows) {
    printPricingEligibilityTool(scanRow);
  }
  printPricingEligibilitySummary(scanRows);
}

async function main() {
  validatePricingSerializer();

  const args = process.argv.slice(2);
  if (args[0] === "--pricing-eligibility-all") {
    try {
      await runPricingEligibilityBatch(args);
    } catch (error) {
      fail("Pricing[] eligibility scan failed", error);
    }
    return;
  }

  if (args[0] === "--all") {
    if (args.includes("--apply")) {
      fail("--apply is only supported for a single tool and is not available with --all.");
      return;
    }
    try {
      await runBatch(args);
    } catch (error) {
      fail("Batch pricing audit failed", error);
    }
    return;
  }

  const slug = args[0];
  const shouldApply = args.includes("--apply");
  const unknownArgs = args.slice(1).filter((arg) => arg !== "--apply");
  if (unknownArgs.length > 0) {
    usage();
    process.exitCode = 1;
    return;
  }
  const tool = TOOLS[slug];
  if (!tool) {
    usage();
    process.exitCode = 1;
    return;
  }

  let current;
  let profile;
  try {
    current = await readCurrentPricing(slug);
    profile = await loadToolProfile(slug);
  } catch (error) {
    fail(`Could not parse current ${slug} pricing from app/tools/toolData.ts`, error);
    return;
  }
  const currentPricingPlans = Array.isArray(profile.pricing) ? profile.pricing : [];

  let fetched;
  try {
    fetched = await fetchPricingPage(tool.sourceUrl);
  } catch (error) {
    const extracted = await extractionAfterPrimaryFailure(
      slug,
      tool,
      error instanceof Error ? error.message : String(error),
      "UNKNOWN",
      tool.sourceUrl,
    );
    printReport(tool, tool.sourceUrl, "Unavailable", current, extracted, "ERROR", "HTTP", currentPricingPlans);
    if (!hasUsefulVerifiedPricing(extracted)) {
      fail("Pricing verification failed", error);
    }
    return;
  }

  if (fetched.fetchStatus === "ERROR") {
    const sourceScope = sourceScopeStatus(tool, tool.sourceUrl, fetched.finalUrl, fetched.fetchStatus);
    const extracted = await extractionAfterPrimaryFailure(
      slug,
      tool,
      fetched.errorMessage,
      sourceScope,
      tool.sourceUrl,
    );
    printReport(tool, tool.sourceUrl, fetched.finalUrl, current, extracted, fetched.fetchStatus, fetched.fetchMethod, currentPricingPlans);
    await maybeApplyPricingPlans(tool, slug, currentPricingPlans, extracted, fetched.fetchStatus, shouldApply);
    if (!hasUsefulVerifiedPricing(extracted)) {
      process.exitCode = 1;
    }
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    fail("OPENAI_API_KEY is required to verify pricing. The key was not printed or used.");
    return;
  }

  try {
    let extracted = await extractPricingWithOpenAI(tool, fetched.text, tool.sourceUrl, fetched.finalUrl);
    let sourceScope = sourceScopeStatus(tool, tool.sourceUrl, fetched.finalUrl, fetched.fetchStatus);

    if (shouldRetryWithPlaywrightAfterExtraction(fetched, extracted)) {
      const browserFetched = await fetchPricingPageWithPlaywright(tool.sourceUrl, fetched.finalUrl, null);
      if (browserFetched.fetchStatus === "ERROR") {
        sourceScope = sourceScopeStatus(tool, tool.sourceUrl, browserFetched.finalUrl, browserFetched.fetchStatus);
        extracted = await extractionAfterPrimaryFailure(
          slug,
          tool,
          browserFetched.errorMessage,
          sourceScope,
          tool.sourceUrl,
        );
        printReport(tool, tool.sourceUrl, browserFetched.finalUrl, current, extracted, browserFetched.fetchStatus, browserFetched.fetchMethod, currentPricingPlans);
        await maybeApplyPricingPlans(tool, slug, currentPricingPlans, extracted, browserFetched.fetchStatus, shouldApply);
        process.exitCode = 1;
        return;
      }

      fetched = browserFetched;
      extracted = await extractPricingWithOpenAI(tool, fetched.text, tool.sourceUrl, fetched.finalUrl);
      sourceScope = sourceScopeStatus(tool, tool.sourceUrl, fetched.finalUrl, fetched.fetchStatus);
    }

    extracted = normalizeExtractionForReport(extracted, sourceScope);
    const fallbackResult = await applySecondarySourceFallback(slug, tool, extracted, fetched.fetchStatus, tool.sourceUrl);

    printReport(tool, tool.sourceUrl, fetched.finalUrl, current, fallbackResult.extracted, fetched.fetchStatus, fetched.fetchMethod, currentPricingPlans);
    await maybeApplyPricingPlans(tool, slug, currentPricingPlans, fallbackResult.extracted, fetched.fetchStatus, shouldApply);
  } catch (error) {
    const extracted = await extractionAfterPrimaryFailure(
      slug,
      tool,
      error instanceof Error ? error.message : String(error),
      "UNKNOWN",
      tool.sourceUrl,
    );
    printReport(tool, tool.sourceUrl, fetched.finalUrl, current, extracted, "ERROR", fetched.fetchMethod, currentPricingPlans);
    await maybeApplyPricingPlans(tool, slug, currentPricingPlans, extracted, "ERROR", shouldApply);
    if (!hasUsefulVerifiedPricing(extracted)) {
      fail("Pricing verification failed", error);
    }
  }
}

main();
