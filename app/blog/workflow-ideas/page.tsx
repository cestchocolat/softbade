import { CategoryHubPage, getCategoryHubMetadata } from "../categoryHubPage";

export const metadata = getCategoryHubMetadata("workflow-ideas");

export default function WorkflowIdeasPage() {
  return <CategoryHubPage slug="workflow-ideas" />;
}
