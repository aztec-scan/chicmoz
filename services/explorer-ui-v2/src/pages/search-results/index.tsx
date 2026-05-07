import { Link, useSearch as useRouteSearch } from "@tanstack/react-router";
import { type FC, type ReactNode, useEffect } from "react";
import { HashCell } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { useSearch } from "~/hooks/api";
import {
  getSearchResultCount,
  getSingleSearchDestination,
} from "~/lib/search-results";

type SearchRouteSearch = {
  q?: unknown;
};

type SearchResultSectionProps = {
  title: string;
  count: number;
  children: ReactNode;
};

type SearchResultLinkProps = {
  label: string;
  meta?: string;
  details?: ReactNode;
  to: string;
  params: Record<string, string>;
  value: string;
};

const SearchResultSection: FC<SearchResultSectionProps> = ({
  title,
  count,
  children,
}) => (
  <div className="panel search-results-panel">
    <div className="panel-head">
      <h3>
        {title}
        <span className="c">{count}</span>
      </h3>
    </div>
    {count > 0 ? children : <div className="empty-state">no matches</div>}
  </div>
);

const SearchResultLink: FC<SearchResultLinkProps> = ({
  label,
  meta,
  details,
  to,
  params,
  value,
}) => (
  <Link className="trow search-result-row" to={to} params={params}>
    <span className="search-result-kind">{label}</span>
    <HashCell value={value} />
    {details ? <span className="search-result-details">{details}</span> : null}
    <span className="search-result-meta">{meta ?? "open →"}</span>
  </Link>
);

export const SearchResultsPage: FC = () => {
  const { q }: SearchRouteSearch = useRouteSearch({ strict: false });
  const query = typeof q === "string" ? q.trim() : q ? String(q).trim() : "";
  const { data, isLoading, isError } = useSearch(query, query.length > 0);
  const singleDestination = data
    ? getSingleSearchDestination(data.results)
    : undefined;

  useEffect(() => {
    if (!singleDestination) {
      return;
    }

    window.location.replace(singleDestination.href);
  }, [singleDestination]);

  const totalResults = data ? getSearchResultCount(data.results) : 0;

  return (
    <Shell>
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "search", active: true },
        ]}
        comment={`/api/l2/search?q=${query || "…"}`}
      />

      <div className="detail-header">
        <div>
          <div className="kicker">Search results</div>
          <h1>{query || "empty query"}</h1>
          <div className="hash">
            {isLoading
              ? "searching…"
              : isError
                ? "search failed"
                : `${totalResults} result${totalResults === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      {!query ? (
        <div className="panel">
          <div className="empty-state">enter a search query in the header</div>
        </div>
      ) : isLoading ? (
        <div className="panel">
          <div className="empty-state">searching…</div>
        </div>
      ) : isError || !data ? (
        <div className="panel">
          <div className="empty-state">search failed</div>
        </div>
      ) : singleDestination ? (
        <div className="panel">
          <div className="empty-state">opening the only result…</div>
        </div>
      ) : totalResults === 0 ? (
        <div className="panel">
          <div className="empty-state">no results found</div>
        </div>
      ) : (
        <div className="search-results-grid">
          <SearchResultSection
            title="Blocks"
            count={data.results.blocks.length}
          >
            {data.results.blocks.map((block) => (
              <SearchResultLink
                key={block.hash}
                label="block"
                to="/blocks/$blockNumber"
                params={{ blockNumber: String(block.blockNumber) }}
                value={block.hash}
                details={
                  <>
                    <span>block #{block.blockNumber.toLocaleString()}</span>
                    <span>slot #{block.slotNumber.toLocaleString()}</span>
                  </>
                }
              />
            ))}
          </SearchResultSection>

          <SearchResultSection
            title="Tx effects"
            count={data.results.txEffects.length}
          >
            {data.results.txEffects.map((txEffect) => (
              <SearchResultLink
                key={txEffect.txHash}
                label="tx-effect"
                meta={txEffect.partOfBlockWithHash ? "mined" : undefined}
                to="/tx-effects/$hash"
                params={{ hash: txEffect.txHash }}
                value={txEffect.txHash}
              />
            ))}
          </SearchResultSection>

          <SearchResultSection
            title="Pending txs"
            count={data.results.pendingTx.length}
          >
            {data.results.pendingTx.map((tx) => (
              <SearchResultLink
                key={tx.txHash}
                label="pending"
                to="/tx-effects/$hash"
                params={{ hash: tx.txHash }}
                value={tx.txHash}
              />
            ))}
          </SearchResultSection>

          <SearchResultSection
            title="Dropped txs"
            count={data.results.droppedTx.length}
          >
            {data.results.droppedTx.map((tx) => (
              <SearchResultLink
                key={tx.txHash}
                label="dropped"
                to="/tx-effects/$hash"
                params={{ hash: tx.txHash }}
                value={tx.txHash}
              />
            ))}
          </SearchResultSection>

          <SearchResultSection
            title="Contract instances"
            count={data.results.contractInstances.length}
          >
            {data.results.contractInstances.map((instance) => (
              <SearchResultLink
                key={instance.address}
                label="instance"
                to="/contracts/instances/$address"
                params={{ address: instance.address }}
                value={instance.address}
              />
            ))}
          </SearchResultSection>

          <SearchResultSection
            title="Contract classes"
            count={data.results.registeredContractClasses.length}
          >
            {data.results.registeredContractClasses.map((contractClass) => (
              <SearchResultLink
                key={`${contractClass.contractClassId}-${contractClass.version}`}
                label={`class v${contractClass.version}`}
                to="/contracts/classes/$id/versions/$version"
                params={{
                  id: contractClass.contractClassId,
                  version: String(contractClass.version),
                }}
                value={contractClass.contractClassId}
              />
            ))}
          </SearchResultSection>

          <SearchResultSection
            title="Validators"
            count={data.results.validators.length}
          >
            {data.results.validators.map((validator) => (
              <SearchResultLink
                key={validator.validatorAddress}
                label="validator"
                to="/validators/$attesterAddress"
                params={{ attesterAddress: validator.validatorAddress }}
                value={validator.validatorAddress}
              />
            ))}
          </SearchResultSection>
        </div>
      )}
    </Shell>
  );
};
