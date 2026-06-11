import { toolProfiles } from "@/app/tools/toolData";
import { topicHubs } from "@/app/topics/topicData";

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
    ...toolUrls,
    ...topicUrls,
  ];
}
