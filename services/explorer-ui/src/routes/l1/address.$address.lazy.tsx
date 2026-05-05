import { createLazyFileRoute } from "@tanstack/react-router";
import { L1AddressDetails } from "~/pages/l1/address-details";

export const Route = createLazyFileRoute("/l1/address/$address")({
  component: L1AddressDetails,
});
