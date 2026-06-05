import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { StatusPill } from "./status-pill";

type VerificationPillKind =
  | "artifact"
  | "source"
  | "deployment"
  | "aztecScanNotes";

interface Props {
  kind: VerificationPillKind;
  verified: boolean;
}

const PILL_COPY: Record<
  VerificationPillKind,
  { hash: string; verifiedLabel: string; unverifiedLabel: string }
> = {
  artifact: {
    hash: "verified-artifact",
    verifiedLabel: "artifact verified",
    unverifiedLabel: "artifact unverified",
  },
  source: {
    hash: "verified-source",
    verifiedLabel: "source verified",
    unverifiedLabel: "source unverified",
  },
  deployment: {
    hash: "verified-deployment",
    verifiedLabel: "deployment verified",
    unverifiedLabel: "deployment unverified",
  },
  aztecScanNotes: {
    hash: "aztec-scan-notes",
    verifiedLabel: "AztecScanNotes listed",
    unverifiedLabel: "AztecScanNotes missing",
  },
};

export const VerificationPillLink: FC<Props> = ({ kind, verified }) => {
  const copy = PILL_COPY[kind];

  return (
    <Link to="/ecosystem" hash={copy.hash}>
      <StatusPill
        status={verified ? "verified" : "unverified"}
        label={verified ? copy.verifiedLabel : copy.unverifiedLabel}
      />
    </Link>
  );
};
