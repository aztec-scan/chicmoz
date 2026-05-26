import { createLazyFileRoute } from "@tanstack/react-router";
import { Landing } from "~/pages/landing";

export const Route = createLazyFileRoute("/")({
  component: Landing,
});
