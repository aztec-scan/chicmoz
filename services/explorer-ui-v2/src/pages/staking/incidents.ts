/**
 * Static incident log for the aztec-scan sequencer. Curated post-mortems;
 * update this file when a new incident is recorded.
 */

export type IncidentStatus = "postmortem" | "resolved" | "ongoing" | "monitoring";
export type IncidentSeverity = "critical" | "major" | "minor";
export type IncidentTimelineTag = "detect" | "mitig" | "resolve" | "";

export interface IncidentTimelineRow {
  t: string;
  tag: IncidentTimelineTag;
  label: string;
  text: string;
}

export interface IncidentImpact {
  label: string;
  value: string;
  tone: "red" | "amber" | "";
}

export interface IncidentSection {
  heading: string;
  body: string;
  hash?: string;
  hashHref?: string;
}

export interface Incident {
  id: string;
  title: string;
  dateLabel: string;
  startedAt: string;
  resolvedAt: string | null;
  durationLabel: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  tldr: string;
  impact: IncidentImpact[];
  timeline: IncidentTimelineRow[];
  sections: IncidentSection[];
}

export const INCIDENTS: Incident[] = [
  {
    id: "2025-01-03-sequencer-downtime",
    title: "Sequencer downtime · web3signer misconfiguration",
    dateLabel: "Jan 3-4, 2025",
    startedAt: "2025-01-03 12:30 UTC",
    resolvedAt: "2025-01-04 21:00 UTC",
    durationLabel: "32h 30m",
    status: "postmortem",
    severity: "major",
    tldr:
      "Our signing-service was down 3/1 12:30 to 4/1 21:00 which resulted in one attester-address being slashed 2,000 AZTEC. Administrative errors from our side — counter-measures have been taken and the attester will be re-paid once the token unlocks.",
    impact: [
      { label: "Attesters slashed", value: "1", tone: "red" },
      { label: "AZTEC slashed", value: "2,000", tone: "red" },
    ],
    timeline: [
      {
        t: "12:30",
        tag: "detect",
        label: "DETECT",
        text:
          "Web3signer + monitoring stack go offline due to server misconfig. Alerts silent.",
      },
      {
        t: "04-01 21:00",
        tag: "resolve",
        label: "RESOLVE",
        text:
          "Attestations resume. Attester-key 0x8d28… confirmed slashed for 2,000 AZTEC.",
      },
    ],
    sections: [
      {
        heading: "Observed issue",
        body:
          "Some of our core infrastructure running in the cloud, namely the web3signing service and our monitoring stack, went offline due to a misconfiguration in our servers. This resulted in nodes not being able to sign attestations and block proposals, and our monitoring stack also being impacted made it so warnings were not appropriately sent out.",
      },
      {
        heading: "Impact",
        body:
          "Besides the obvious fact of us losing trust from the people staking their AZTEC to us, and us not performing the duties as a sequencer in the network, we also had one of our attester-keys slashed:",
        hash: "0x8d28ee3293d02a7be59b06549185e8a4835df5e5",
        hashHref:
          "https://dashtec.xyz/sequencers/0x8d28ee3293d02a7be59b06549185e8a4835df5e5",
      },
      {
        heading: "Fixes and counter measures",
        body:
          "On the bright side, our recent infrastructure changes made it extremely easy for us to add two new VPSes and set-up both monitoring and signing in no time.",
      },
      {
        heading: "Next steps",
        body:
          "As for the trust, we now pledge to pay back the slashed AZTEC to the address once tokens are unlocked. Going forward, we are working on setting up an external monitoring system in the near future — and looking into distributing our signing-service.",
      },
    ],
  },
];

export const PROVIDER = {
  name: "aztec-scan",
  id: "provider #4",
  sequencerAddr: "0x8d28ee3293d02a7be59b06549185e8a4835df5e5",
  withdrawer: "0xf7b2b9c5ae113d8cbb4a72d6a5c82d90e3e6e4e7",
  region: "eu-west / infra-redundant",
  nodeVersion: "aztec-nargo 0.87.4",
  online: true,
  feeBps: 2500,
} as const;

export const STAKE_URL = "https://stake.aztec.network/providers/4";
export const DASHTEC_URL = "https://dashtec.xyz/providers/4";
export const COMMISSION_FORUM_URL =
  "https://forum.aztec.network/t/operator-commission-adjustments/8588";
export const PAYOUT_AUDIT_URL =
  "https://github.com/aztec-scan/aztec-payout-audit";
