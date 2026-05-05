import { createLazyFileRoute } from "@tanstack/react-router";
import { AboutUsPage } from "~/pages/static/about-us";

export const Route = createLazyFileRoute("/about-us")({
  component: AboutUsPage,
});
