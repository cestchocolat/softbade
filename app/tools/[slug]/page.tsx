import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ToolDetailTemplate from "../../../components/tools/ToolDetailTemplate";
import { getToolProfile, toolProfiles } from "../toolData";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return toolProfiles.map((tool) => ({ slug: tool.slug }));
}

function normalizeToolSlug(slug: string) {
  return decodeURIComponent(slug)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolProfile(slug) ?? getToolProfile(normalizeToolSlug(slug));

  if (!tool) {
    return {};
  }

  return {
    title: tool.seoTitle,
    description: tool.metaDescription,
    alternates: {
      canonical: tool.canonicalUrl,
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.metaDescription,
      url: tool.canonicalUrl,
      type: "article",
      images: [
        {
          url: tool.screenshots[0]?.image,
          alt: `${tool.name} overview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tool.seoTitle,
      description: tool.metaDescription,
      images: [tool.screenshots[0]?.image],
    },
  };
}

function createToolSchema(tool: NonNullable<ReturnType<typeof getToolProfile>>) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: tool.metaDescription,
    url: tool.canonicalUrl,
    image: tool.screenshots[0]?.image,
    offers: tool.pricing.map((plan) => ({
      "@type": "Offer",
      name: plan.plan,
      price: plan.price === "$0" ? "0" : undefined,
      priceCurrency: plan.price === "$0" ? "USD" : undefined,
      description: `${plan.price}: ${plan.details}`,
      url: tool.websiteUrl,
    })),
  };
}

function createFaqSchema(tool: NonNullable<ReturnType<typeof getToolProfile>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function createBreadcrumbSchema(tool: NonNullable<ReturnType<typeof getToolProfile>>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: tool.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: crumb.href.startsWith("http") ? crumb.href : `https://softbade.com${crumb.href}`,
    })),
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeToolSlug(slug);
  const tool = getToolProfile(slug) ?? getToolProfile(normalizedSlug);

  if (!tool) {
    notFound();
  }

  if (slug !== tool.slug) {
    redirect(`/tools/${tool.slug}`);
  }

  const schemas = [createToolSchema(tool), createFaqSchema(tool), createBreadcrumbSchema(tool)];

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ToolDetailTemplate tool={tool} />
    </>
  );
}
