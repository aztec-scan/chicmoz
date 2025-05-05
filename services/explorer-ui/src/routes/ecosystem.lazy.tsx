import { createLazyFileRoute } from "@tanstack/react-router";
import { Ecosystem } from "~/pages/ecosystem";

export const Route = createLazyFileRoute("/ecosystem")({
  component: Ecosystem,
});
