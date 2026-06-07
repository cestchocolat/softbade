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
  ];
}