import { CHICMOZ_TYPES_AZTEC_VERSION } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import {
  useChainErrors,
  useChainInfo,
  useContractInstancesWithBalance,
  useSequencers,
  useSubTitle,
} from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";
import { formatTimeSince } from "~/lib/utils";
import { routes } from "~/routes/__root";
import {
  API_URL,
  CHICMOZ_ALL_UI_URLS,
  L2_NETWORK_ID,
  VERSION_STRING,
  WS_URL,
} from "~/service/constants";

export const DevPage: FC = () => {
  useSubTitle(routes.dev.title);
  const {
    data: chainInfo,
    isLoading: isChainInfoLoading,
    error: chainInfoError,
  } = useChainInfo();

  const {
    data: chainErrors,
    isLoading: isChainErrorsLoading,
    error: chainErrorsError,
  } = useChainErrors();

  const {
    data: sequencers,
    isLoading: isSequencersLoading,
    error: sequencersError,
  } = useSequencers();

  const {
    data: contractInstancesWithBalance,
    isLoading: isContractInstancesWithBalanceLoading,
    error: contractInstancesWithBalanceError,
  } = useContractInstancesWithBalance();

  const generateCard = (title: string, content: string | JSX.Element) => (
    <div className="bg-white w-full rounded-lg shadow-md p-4 md:w-[80%] mt-4">
      <h2>{title}</h2>
      {content}
    </div>
  );

  return (
    <BaseLayout>
      <div className="flex flex-col items-center">
        <h1>Dev Page</h1>
        {generateCard(
          "NOTE",
          <p>
            This page is for allowing access to data that is not yet available
            or refined. If you see anything here that you think can be useful
            someplace else on the site, please create an issue on our Github
            (see footer for link).
            <br />
            <br />
            This page will not be linked to from anywhere once mainnet is
            launched.
          </p>,
        )}
        {generateCard(
          "Misc",
          <pre>
            <p>{`Aztec.js version           ${CHICMOZ_TYPES_AZTEC_VERSION}`}</p>
            <p>{`Explorer version           ${VERSION_STRING}`}</p>
            <p>{`API URL                    ${API_URL}`}</p>
            <p>{`WS URL                     ${WS_URL}`}</p>
            <p>{`Indexing Aztec network     ${L2_NETWORK_ID}`}</p>
          </pre>,
        )}
        {generateCard(
          "links",
          <>
            <h3>Internal</h3>
            <p>
              <Link
                to={routes.feeRecipients.route}
                className="text-purple-light hover:font-bold"
              >
                {routes.feeRecipients.title}
              </Link>
            </p>
            <h3>External</h3>
            <ul>
              {CHICMOZ_ALL_UI_URLS.map((ui) => (
                <li key={ui.name}>
                  <a
                    href={ui.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-light hover:font-bold"
                  >
                    {ui.name} ({ui.url})
                  </a>
                </li>
              ))}
            </ul>
          </>,
        )}
        {generateCard(
          "Chain Info",
          <>
            {isChainInfoLoading && <p>Loading...</p>}
            {chainInfoError && <p>Error: {chainInfoError.message}</p>}
            {chainInfo && (
              <pre>
                {JSON.stringify(
                  {
                    ...chainInfo,
                    rollupVersion: chainInfo.rollupVersion.toString(),
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </>,
        )}
        {generateCard(
          "Chain Errors",
          <>
            {isChainErrorsLoading && <p>Loading...</p>}
            {chainErrorsError && <p>Error: {chainErrorsError.message}</p>}
            {chainErrors && (
              <div>
                {chainErrors?.map((error) => (
                  <pre key={error.name}>
                    <hr />
                    <h3>{error.name}</h3>
                    {`
rpcNodeName:    ${error.rpcNodeName}
count:          ${error.count}
cause:          ${error.cause}
firstSeen:      ${formatTimeSince(error.createdAt.getTime())} ago
lastSeenAt:     ${formatTimeSince(error.lastSeenAt.getTime())} ago
data:           ${JSON.stringify(error.data)}

message:        ${error.message}
stack:          ${error.stack}
`}
                  </pre>
                ))}
              </div>
            )}
          </>,
        )}
        {generateCard(
          "Sequencers",
          <>
            {isSequencersLoading && <p>Loading...</p>}
            {sequencersError && <p>Error: {sequencersError.message}</p>}
            {sequencers && (
              <pre>
                {JSON.stringify(
                  sequencers.map((s) => ({
                    ...s,
                    rollupVersion: s.rollupVersion.toString(),
                  })),
                  null,
                  2,
                )}
              </pre>
            )}
          </>,
        )}
        {generateCard(
          "Instances with balance",
          <>
            {isContractInstancesWithBalanceLoading && <p>Loading...</p>}
            {contractInstancesWithBalanceError && (
              <p>Error: {contractInstancesWithBalanceError.message}</p>
            )}
            {contractInstancesWithBalance && (
              <div>
                <p>
                  Found {contractInstancesWithBalance.length} contract instances
                  with balance
                </p>
                {contractInstancesWithBalance.length > 0 && (
                  <pre>
                    {JSON.stringify(
                      contractInstancesWithBalance.map((instance) => ({
                        contractAddress: instance.contractAddress,
                        balance: Number(instance.balance),
                        timestamp: instance.timestamp,
                      })),
                      null,
                      2,
                    )}
                  </pre>
                )}
              </div>
            )}
          </>,
        )}
      </div>
    </BaseLayout>
  );
};
