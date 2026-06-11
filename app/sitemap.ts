import { toolProfiles } from "@/app/tools/toolData";
import { topicHubs } from "@/app/topics/topicData";
import { articles } from "@/app/blog/articles";

export default function sitemap() {
  const baseUrl = "https://softbade.com";
  const lastModified = new Date();

  const staticUrls = ["", "/tools", "/categories"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));

  const categoryUrls = [
    "/categories/ai-automation",
    "/categories/marketing-seo",
    "/categories/productivity",
    "/categories/crm-sales",
    "/categories/design-creative",
    "/categories/finance-tools",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));

  const blogUrls = articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.dateTime),
  }));

  const toolUrls = toolProfiles.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified,
  }));

  const topicUrls = topicHubs.map((topic) => ({
    url: `${baseUrl}/topics/${topic.slug}`,
    lastModified,
  }));

  return [
    ...staticUrls,
    ...categoryUrls,
    ...blogUrls,
    ...toolUrls,
    ...topicUrls,
  ];
}
