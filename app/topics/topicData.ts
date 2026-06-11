import { articles, topicSlug, type Article } from "../blog/articles";
import { toolProfiles, type ToolProfile } from "../tools/toolData";

export type TopicHub = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  relatedCategories: { title: string; href: string }[];
};

export const topicHubs: TopicHub[] = [
  {
    slug: "chatgpt",
    title: "ChatGPT",
    description:
      "Explore ChatGPT guides, comparisons, workflows, prompts, and related AI tools for writing, research, productivity, and business automation.",
    keywords: ["chatgpt", "openai", "gpt", "ai assistant", "prompt"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Productivity", href: "/categories/productivity" },
    ],
  },
  {
    slug: "claude",
    title: "Claude",
    description:
      "Browse Claude comparisons, AI writing workflows, productivity guides, and resources for choosing the right AI assistant.",
    keywords: ["claude", "anthropic", "ai assistant", "long documents", "writing review"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Productivity", href: "/categories/productivity" },
    ],
  },
  {
    slug: "gemini",
    title: "Gemini",
    description:
      "Discover Gemini guides, AI assistant comparisons, productivity workflows, and resources for teams using Google-connected AI tools.",
    keywords: ["gemini", "google", "ai assistant", "workspace", "google workspace"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Productivity", href: "/categories/productivity" },
    ],
  },
  {
    slug: "ai-writing",
    title: "AI Writing",
    description:
      "Find AI writing tools, content workflows, copywriting guides, SEO writing resources, and practical advice for publishing better content faster.",
    keywords: ["ai writing", "writing", "copywriting", "content", "seo content", "blog"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Marketing & SEO", href: "/categories/marketing-seo" },
    ],
  },
  {
    slug: "automation",
    title: "Automation",
    description:
      "Explore workflow automation examples, no-code automation tools, AI automation guides, and practical systems for reducing manual work.",
    keywords: ["automation", "workflow", "zapier", "make", "n8n", "automate"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Productivity", href: "/categories/productivity" },
    ],
  },
  {
    slug: "productivity",
    title: "Productivity",
    description:
      "Browse productivity tools, AI productivity workflows, task systems, meeting notes, planning guides, and software for working smarter.",
    keywords: ["productivity", "task", "planning", "meeting", "notes", "workflow"],
    relatedCategories: [
      { title: "Productivity", href: "/categories/productivity" },
      { title: "AI & Automation", href: "/categories/ai-automation" },
    ],
  },
  {
    slug: "marketing",
    title: "Marketing",
    description:
      "Discover AI marketing tools, SEO workflows, campaign planning guides, social media systems, and SaaS resources for growth teams.",
    keywords: ["marketing", "seo", "campaign", "social media", "ads", "email"],
    relatedCategories: [
      { title: "Marketing & SEO", href: "/categories/marketing-seo" },
      { title: "AI & Automation", href: "/categories/ai-automation" },
    ],
  },
  {
    slug: "saas",
    title: "SaaS",
    description:
      "Compare SaaS tools, startup software stacks, productivity platforms, CRM systems, and practical resources for choosing business software.",
    keywords: ["saas", "software", "platform", "subscription", "business software", "tool"],
    relatedCategories: [
      { title: "CRM & Sales", href: "/categories/crm-sales" },
      { title: "Productivity", href: "/categories/productivity" },
    ],
  },
  {
    slug: "startups",
    title: "Startups",
    description:
      "Explore AI tools for startups, SaaS stacks, founder workflows, automation ideas, and practical software guides for lean teams.",
    keywords: ["startup", "startups", "founder", "solopreneur", "small business"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Marketing & SEO", href: "/categories/marketing-seo" },
    ],
  },
  {
    slug: "no-code",
    title: "No-Code",
    description:
      "Find no-code AI tools, automation platforms, workflow builders, and practical guides for creating systems without heavy engineering work.",
    keywords: ["no-code", "nocode", "no code", "automation", "workflow builder"],
    relatedCategories: [
      { title: "AI & Automation", href: "/categories/ai-automation" },
      { title: "Productivity", href: "/categories/productivity" },
    ],
  },
];

const topicBySlug = new Map(topicHubs.map((topic) => [topic.slug, topic]));

export function getTopicHub(slug: string) {
  return topicBySlug.get(slug);
}

function searchableArticleText(article: Article) {
  return [
    article.title,
    article.seoTitle,
    article.metaDescription,
    article.category,
    article.excerpt,
    article.keyword,
    article.audience,
    article.promise,
    article.context,
    ...article.tools,
    ...(article.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function searchableToolText(tool: ToolProfile) {
  return [
    tool.name,
    tool.slug,
    tool.tagline,
    tool.description,
    tool.seoTitle,
    tool.metaDescription,
    tool.pricingSummary,
    tool.actionCard.quickFacts.bestFor,
    ...tool.categories,
    ...tool.bestFor,
    ...tool.features.map((feature) => `${feature.title} ${feature.description}`),
  ]
    .join(" ")
    .toLowerCase();
}

function includesKeyword(text: string, keyword: string) {
  return text.includes(keyword.toLowerCase());
}

export function getArticleTopicSlugs(article: Article) {
  const explicitTags = article.tags?.map(topicSlug) ?? [];
  const text = searchableArticleText(article);
  const inferred = topicHubs
    .filter((topic) => topic.keywords.some((keyword) => includesKeyword(text, keyword)))
    .map((topic) => topic.slug);

  return [...explicitTags, ...inferred].filter(
    (slug, index, list) => topicBySlug.has(slug) && list.indexOf(slug) === index
  );
}

export function getToolTopicSlugs(tool: ToolProfile) {
  const text = searchableToolText(tool);
  return topicHubs
    .filter((topic) => topic.keywords.some((keyword) => includesKeyword(text, keyword)))
    .map((topic) => topic.slug);
}

export function getPrimaryTopicForArticle(article: Article) {
  const [slug] = getArticleTopicSlugs(article);
  return slug ? getTopicHub(slug) : undefined;
}

export function getPrimaryTopicForTool(tool: ToolProfile) {
  const [slug] = getToolTopicSlugs(tool);
  return slug ? getTopicHub(slug) : undefined;
}

export function getArticlesForTopic(slug: string) {
  return articles.filter((article) => getArticleTopicSlugs(article).includes(slug));
}

export function getToolsForTopic(slug: string) {
  return toolProfiles.filter((tool) => getToolTopicSlugs(tool).includes(slug));
}

export function getRelatedArticlesForTool(tool: ToolProfile) {
  const topicSlugs = getToolTopicSlugs(tool);
  const related = articles.filter((article) =>
    getArticleTopicSlugs(article).some((slug) => topicSlugs.includes(slug))
  );

  return related.slice(0, 6);
}
