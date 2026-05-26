import { createLazyFileRoute } from "@tanstack/react-router";
import { AddressDetailsPage } from "~/pages/address-details";

export const Route = createLazyFileRoute("/address/$address")({
  component: AddressDetailsPage,
});
