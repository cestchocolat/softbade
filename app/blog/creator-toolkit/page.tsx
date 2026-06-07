import { CategoryHubPage, getCategoryHubMetadata } from "../categoryHubPage";

export const metadata = getCategoryHubMetadata("creator-toolkit");

export default function CreatorToolkitPage() {
  return <CategoryHubPage slug="creator-toolkit" />;
}
