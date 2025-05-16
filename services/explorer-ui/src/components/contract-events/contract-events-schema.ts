export interface ContractEventTableSchema {
  eventName: string;
  l1ContractAddress: string;
  l1BlockNumber: bigint;
  l1BlockHash: string;
  isFinalized: boolean;
  l1TransactionHash?: string | null;
  eventArgs?: Record<string, unknown>;
  l1BlockTimestamp?: Date | null;
  id?: string;
}
