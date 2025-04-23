import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { InfoBadge } from "~/components/info-badge";
import { useContractInstancesWithAztecScanNotes, useSubTitle } from "~/hooks";
import { truncateHashString } from "~/lib/create-hash-string";
import { routes } from "~/routes/__root";

export const Ecosystem: FC = () => {
  const { data, isLoading, error } = useContractInstancesWithAztecScanNotes();
  useSubTitle("Ecosystem");
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  const toggleMetadata = () => {
    setIsMetadataExpanded(!isMetadataExpanded);
  };

  const contractsList = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.map((contract) => {
      const origin = contract.aztecScanNotes.origin;
      const name = contract.aztecScanNotes.name;
      const address = contract.address;
      return {
        title: origin,
        name,
        address,
        comment: contract.aztecScanNotes.comment,
      };
    });
  }, [data]);
  return (
    <div className="flex flex-col items-center">
      <h1>Ecosystem</h1>
      <div className="bg-white w-full rounded-lg shadow-md p-4 md:w-2/3 mb-6">
        <ul className="list-disc list-inside">
          <li>Sepolia ETH Faucet: TODO</li>
          <li>Aztec Faucet: TODO</li>
          <li>
            <a
              href="https://aztec.network/ecosystem"
              target="_blank"
              rel="noreferrer"
              className="text-purple-light hover:font-bold"
            >
              Aztec Ecosystem Page
            </a>
          </li>
        </ul>

        <div className="border-t border-gray-200 pt-3 mt-4">
          <button
            onClick={toggleMetadata}
            className="flex items-center justify-between w-full text-left font-semibold text-lg"
            aria-expanded={isMetadataExpanded}
          >
            {isMetadataExpanded ? (
              <>
                <span className="text-purple-light">Hide</span>
                <ChevronUp className="h-5 w-5 text-gray-500" />
              </>
            ) : (
              <>
                <span className="text-purple-light">
                  Want to know more about Aztec Scan's contract metadata?
                </span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </>
            )}
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isMetadataExpanded
                ? "max-h-[1000px] opacity-100 mt-3"
                : "max-h-0 opacity-0"
            }`}
          >
            <h3>Contract Metadata</h3>
            <p className="mb-4">
              There are four things that add metadata to contracts:
              AztecScanNotes, uploading artifact, verifying deployment, and
              deployer details.
            </p>

            <h4 className="font-medium mt-3">Aztec Scan Notes</h4>
            <p className="mb-4">
              Aztec Scan Notes are a way to add metadata to contracts on the
              Aztec network. They are manually added by the AztecScan team.{" "}
              <br />
              If you want to have your contract added here,{" "}
              <a
                href="https://github.com/aztec-scan/chicmoz/blob/main/services/explorer-api/src/constants.ts"
                target="_blank"
                rel="noreferrer"
                className="text-purple-light hover:font-bold"
              >
                please create a PR to this file
              </a>
              .
            </p>

            <h4 className="font-medium mt-3">Uploading Artifact</h4>
            <p className="mb-4">
              Anyone can upload an artifact to a contract. This will add the
              artifact to the contract and make it available for anyone to see.
              <br />
              <a
                href="https://docs.aztecscan.xyz/"
                target="_blank"
                rel="noreferrer"
                className="text-purple-light hover:font-bold"
              >
                Please refer to the docs for more information.
              </a>
            </p>

            <h4 className="font-medium mt-3">Verified Deployment</h4>
            <p className="mb-4">
              Verified deployment is a way to verify the deployment of a
              contract. This is done by the deployer of the contract. It
              verifies the deployment arguments and makes them available for
              anyone to see.
              <br />
              <a
                href="https://docs.aztecscan.xyz/"
                target="_blank"
                rel="noreferrer"
                className="text-purple-light hover:font-bold"
              >
                Please refer to the docs for more information.
              </a>
            </p>

            <h4 className="font-medium mt-3">Deployer Details</h4>
            <p className="mb-4">
              Deployer details are a way to add metadata to the deployer of a
              contract. This is done by the verified deployer of the contract.
              It adds the contact information and makes it available for anyone
              to see.
              <br />
              <a
                href="https://docs.aztecscan.xyz/"
                target="_blank"
                rel="noreferrer"
                className="text-purple-light hover:font-bold"
              >
                Please refer to the docs for more information.
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap md:w-2/3 mb-6">
        <p className="text-sm text-gray-600 mb-4 px-4">
          ⚠️ Disclaimer ⚠️ The contracts listed here are contracts that
          aztecscan.xyz has manually added with AztecScanNotes. It means that
          they have a known origin. IT DOES NOT MEAN THAT THEY ARE A) AUDITED OR
          B) SAFE TO USE.
          <br />
          <br />
          Please do your own research and due diligence before interacting with
          any of these contracts.
        </p>
      </div>

      {isLoading && <div className="text-center">Loading contracts...</div>}

      {error && (
        <div className="text-center text-red-500">
          Error loading contracts: {error.message}
        </div>
      )}

      {!isLoading && !error && contractsList.length === 0 && (
        <div className="text-center">No ecosystem contracts found</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full md:w-2/3">
        {contractsList.map((contract, index) => (
          <Link
            key={index}
            to={`${routes.contracts.route}${routes.contracts.children.instances.route}/${contract.address}`}
            className="block hover:no-underline"
          >
            <InfoBadge
              title={truncateHashString(contract.address)}
              data={contract.name}
              isLoading={isLoading}
              error={error}
            />
            {contract.comment && (
              <p className="text-sm text-gray-600 mt-1 px-4">
                {contract.comment}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};
