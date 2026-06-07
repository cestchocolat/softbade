import { CategoryHubPage, getCategoryHubMetadata } from "../categoryHubPage";

export const metadata = getCategoryHubMetadata("beginner-guides");

export default function BeginnerGuidesPage() {
  return <CategoryHubPage slug="beginner-guides" />;
}
