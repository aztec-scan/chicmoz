import { type FC } from "react";
import { TokenEtherscanLink } from "~/components/common";
import { Shell } from "~/components/layout";
import {
  useAverageBlockTime,
  useAverageFees,
  useBlocksByFinalizationStatus,
  useChainErrors,
  useChainInfo,
  useDroppedTxsLast24h,
  useLatestBlock,
  useLatestTableBlocks,
  useLatestTableTxEffects,
  usePendingTxs,
  useReorgs,
  useTotalContracts,
  useTotalContractsLast24h,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks/api";
import { fmtNum, formatFees, getFeeJuiceSymbol } from "~/lib/utils";
import { ChainInfoBand } from "./chain-info-band";
import { HeroTip } from "./hero-tip";
import { LatestLists } from "./latest-lists";

export const Landing: FC = () => {
  const { data: latestBlock } = useLatestBlock();
  const { data: blocksByStatus } = useBlocksByFinalizationStatus();
  const { data: tableBlocks } = useLatestTableBlocks();
  const { data: tableTxs } = useLatestTableTxEffects();
  const { data: pendingTxs } = usePendingTxs();
  const { data: droppedTxs24h } = useDroppedTxsLast24h();
  const { data: reorgs } = useReorgs();
  const { data: chainErrors } = useChainErrors();
  const { data: chainInfo } = useChainInfo();

  const { data: totalTxEffects } = useTotalTxEffects();
  const { data: txEffects24h } = useTotalTxEffectsLast24h();
  const { data: totalContracts } = useTotalContracts();
  const { data: contracts24h } = useTotalContractsLast24h();
  const { data: averageFees } = useAverageFees();
  const { data: averageBlockTime } = useAverageBlockTime();

  const blockRows = (tableBlocks ?? []).slice(0, 10);
  const txRows = (tableTxs ?? []).slice(0, 10);
  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;

  return (
    <Shell active="home">
      <HeroTip
        latestBlock={latestBlock}
        blocksByStatus={blocksByStatus}
        chainInfo={chainInfo}
        averageBlockTime={averageBlockTime}
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total tx-effects</div>
          <div className="val">{fmtNum(totalTxEffects)}</div>
          <div className="sub">
            <em>+{fmtNum(txEffects24h)}</em> last 24h
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Total contracts</div>
          <div className="val">{fmtNum(totalContracts)}</div>
          <div className="sub">
            <em>+{fmtNum(contracts24h)}</em> last 24h
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Avg fees</div>
          <div className="val">
            {formatFees(averageFees, feeJuiceDecimals)}
            <TokenEtherscanLink
              symbol={feeJuiceSymbol}
              address={feeJuiceAddress}
              className="u"
            />
          </div>
          <div className="sub">last 100 blocks</div>
        </div>
        <div className="sc">
          <div className="lbl">Pending mempool</div>
          <div className="val">
            {fmtNum(pendingTxs?.length ?? 0)}
            <span className="u">txs</span>
          </div>
          <div className="sub">waiting for inclusion</div>
        </div>
      </div>

      <LatestLists
        blocks={blockRows}
        txs={txRows}
        feeJuiceDecimals={feeJuiceDecimals}
        feeJuiceSymbol={feeJuiceSymbol}
        feeJuiceAddress={feeJuiceAddress}
      />

      <ChainInfoBand
        chainInfo={chainInfo}
        pendingTxs={pendingTxs}
        reorgs={reorgs}
        chainErrors={chainErrors}
        averageBlockTime={averageBlockTime}
        droppedTxs24h={droppedTxs24h}
      />
    </Shell>
  );
};
