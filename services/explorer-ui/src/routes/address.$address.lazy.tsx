import { createLazyFileRoute } from "@tanstack/react-router";
import { AddressDetails } from "~/pages/address-details";

export const Route = createLazyFileRoute("/address/$address")({
  component: AddressDetails,
});
