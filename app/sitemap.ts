import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://softbade.com",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/tools",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/categories",
      lastModified: new Date(),
    },

    {
      url: "https://softbade.com/categories/ai-automation",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/categories/crm-sales",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/categories/design-creative",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/categories/finance-tools",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/categories/marketing-seo",
      lastModified: new Date(),
    },
    {
      url: "https://softbade.com/categories/productivity",
      lastModified: new Date(),
    },
  ];
}