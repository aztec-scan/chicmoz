import { createLazyFileRoute } from "@tanstack/react-router";
import { SearchResultsPage } from "~/pages/search-results";

export const Route = createLazyFileRoute("/search")({
  component: SearchResultsPage,
});
