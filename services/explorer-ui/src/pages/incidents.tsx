import { type FC } from "react";
import { useSubTitle } from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";
import { routes } from "~/routes/__root";

type IncidentStatus = "resolved" | "ongoing";

interface Incident {
  id: string;
  title: string;
  date: string;
  status: IncidentStatus;
  content: JSX.Element;
}

const incidents: Incident[] = [
  {
    id: "2025-01-03-sequencer-downtime",
    title: "Post Mortem: Sequencer downtime during Jan 3-4",
    date: "January 3-4, 2025",
    status: "resolved",
    content: (
      <>
        <p className="mb-4">
          TLDR; Our signing-service was down 3/1 12:30 to 4/1 21:00 which
          resulted in one attester-address being slashed 2,000 AZTEC.
          Administrative errors from our side, counter-measures have been taken
          and the Attester will be re-paid once the token unlocks.
        </p>

        <h3 className="text-lg text-purple-light mt-6 mb-2">Observed issue</h3>
        <p className="mb-4">
          Some of our core infrastructure running in the cloud, namely
          web3signing service and our monitoring stack, went offline due to a
          misconfiguration in our servers. This resulted in nodes not being able
          to sign attestations and block proposals, and our monitoring stack
          also being impacted made it so warnings were not appropriately sent
          out.
        </p>

        <h3 className="text-lg text-purple-light mt-6 mb-2">Impact</h3>
        <p className="mb-4">
          Besides the obvious fact of us losing trust from the people staking
          their AZTEC to us, and us not performing the duties as a sequencer in
          the network. We also had one of our attester-keys slashed, namely this
          one:{" "}
          <a
            href="https://dashtec.xyz/sequencers/0x8d28ee3293d02a7be59b06549185e8a4835df5e5"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-light hover:text-purple-dark underline"
          >
            0x8d28ee3293d02a7be59b06549185e8a4835df5e5
          </a>
        </p>

        <h3 className="text-lg text-purple-light mt-6 mb-2">
          Fixes and counter measures
        </h3>
        <p className="mb-4">
          On the bright side, our recent infrastructure-changes made it
          extremely easy for us to add two new VPSes and set-up both monitoring
          and signing in no-time.
        </p>
        <p>
          As for the trust, we now pledge to pay back the slashed AZTEC to the
          address once tokens are unlocked. We also hope that the transparency
          of creating this post-mortem will help in restoring some of it.
        </p>
      </>
    ),
  },
];

const StatusBadge: FC<{ status: IncidentStatus }> = ({ status }) => {
  const isResolved = status === "resolved";
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isResolved
        ? "bg-green"
        : "bg-yellow"
        }`}
    >
      {isResolved ? "Resolved" : "Ongoing"}
    </span>
  );
};

const IncidentCard: FC<{ incident: Incident }> = ({ incident }) => (
  <div className="bg-white w-full rounded-lg shadow-md p-6 md:w-[80%] mt-4">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
      <h2 className="text-xl text-purple-light font-bold mb-2 md:mb-0">{incident.title}</h2>
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-sm">{incident.date}</span>
        <StatusBadge status={incident.status} />
      </div>
    </div>
    <div>{incident.content}</div>
  </div>
);

export const Incidents: FC = () => {
  useSubTitle(routes.incidents.title);

  return (
    <BaseLayout>
      <div className="flex flex-col items-center">
        <h1>Aztecscan Incidents</h1>
        {incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </BaseLayout>
  );
};
