import { CategoryHubPage, getCategoryHubMetadata } from "../categoryHubPage";

export const metadata = getCategoryHubMetadata("updates-insights");

export default function UpdatesInsightsPage() {
  return <CategoryHubPage slug="updates-insights" />;
}
