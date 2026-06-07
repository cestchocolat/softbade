import { CategoryHubPage, getCategoryHubMetadata } from "../categoryHubPage";

export const metadata = getCategoryHubMetadata("productivity-hacks");

export default function ProductivityHacksPage() {
  return <CategoryHubPage slug="productivity-hacks" />;
}
