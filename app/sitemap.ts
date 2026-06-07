import { toolProfiles } from "@/app/tools/toolData";

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

  return [
    ...staticUrls,
    ...categoryUrls,
    ...toolUrls,
  ];
}
