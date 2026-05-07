import { type ChicmozSearchResults } from "@chicmoz-pkg/types";

export type SearchDestination = {
  label: string;
  href: string;
  params: Record<string, string>;
};

export const getSearchResultCount = (
  results: ChicmozSearchResults["results"],
): number => {
  return Object.values(results).reduce(
    (count, group) => count + group.length,
    0,
  );
};

export const getSingleSearchDestination = (
  results: ChicmozSearchResults["results"],
): SearchDestination | undefined => {
  if (getSearchResultCount(results) !== 1) {
    return undefined;
  }

  const [block] = results.blocks;
  if (block) {
    return {
      label: "block",
      href: `/blocks/${block.blockNumber}`,
      params: { blockNumber: String(block.blockNumber) },
    };
  }

  const [txEffect] = results.txEffects;
  if (txEffect) {
    return {
      label: "tx-effect",
      href: `/tx-effects/${txEffect.txHash}`,
      params: { hash: txEffect.txHash },
    };
  }

  const [pendingTx] = results.pendingTx;
  if (pendingTx) {
    return {
      label: "pending tx",
      href: `/tx-effects/${pendingTx.txHash}`,
      params: { hash: pendingTx.txHash },
    };
  }

  const [droppedTx] = results.droppedTx;
  if (droppedTx) {
    return {
      label: "dropped tx",
      href: `/tx-effects/${droppedTx.txHash}`,
      params: { hash: droppedTx.txHash },
    };
  }

  const [contractInstance] = results.contractInstances;
  if (contractInstance) {
    return {
      label: "contract instance",
      href: `/contracts/instances/${contractInstance.address}`,
      params: { address: contractInstance.address },
    };
  }

  const [contractClass] = results.registeredContractClasses;
  if (contractClass) {
    return {
      label: "contract class",
      href: `/contracts/classes/${contractClass.contractClassId}/versions/${contractClass.version}`,
      params: {
        id: contractClass.contractClassId,
        version: String(contractClass.version),
      },
    };
  }

  const [validator] = results.validators;
  if (validator) {
    return {
      label: "validator",
      href: `/validators/${validator.validatorAddress}`,
      params: { attesterAddress: validator.validatorAddress },
    };
  }

  const [account] = results.accounts;
  if (account) {
    return {
      label: "account",
      href: `/address/${account.address}`,
      params: { address: account.address },
    };
  }

  return undefined;
};
