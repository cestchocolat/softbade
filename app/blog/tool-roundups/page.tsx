import { CategoryHubPage, getCategoryHubMetadata } from "../categoryHubPage";

export const metadata = getCategoryHubMetadata("tool-roundups");

export default function ToolRoundupsPage() {
  return <CategoryHubPage slug="tool-roundups" />;
}
