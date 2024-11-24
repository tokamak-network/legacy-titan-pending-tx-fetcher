import { BigNumber } from "ethers";

export interface SentMessage {
  id: string;
  target: string;
  sender: string;
  message: string;
  messageNonce: string;
  gasLimit: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface SentMessageWithAddress extends SentMessage {
  account: string;
}

export interface WithdrawalInitiated {
  id: string;
  _l1Token: string;
  _l2Token: string;
  _from: string;
  _to: string;
  _amount: string;
  _data: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface StateBatchAppended {
  id: string;
  _batchIndex: string;
  _batchRoot: string;
  _batchSize: string;
  _prevTotalElements: string;
  _extraData: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  rollUpBatch: string;
}

export interface RollUpMessage extends SentMessageWithAddress {
  msgHash: string;
}

export interface PendingWithdrawal extends RollUpMessage {
  stateBatchAppended: StateBatchAppended;
}

export interface FinalWithdrawal extends PendingWithdrawal {
  proof: any;
}

export interface SentMessageResponse {
  sentMessages: SentMessage[];
}

export interface WithdrawalInitiatedResponse {
  withdrawalInitiateds: WithdrawalInitiated[];
}

export interface StateBatchAppendedResponse {
  stateBatchAppendeds: StateBatchAppended[];
}

export interface SentMessageVars {
  L1Bridge: string;
  blockNumber_gte: string;
  first: number;
}

export interface StateBatchAppendedVars {
  blockNumber_gte: string;
  first: number;
}

export interface RelayedWithdrawal {
  id: string;
  msgHash: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface RelayedWithdrawalResponse {
  relayedMessages: RelayedWithdrawal[];
}

export interface WithdrawalInitiatedVars {
  blockNumber_gte: string;
  first: number;
}

export type Resolved = {
  target: string;
  sender: string;
  message: string;
  messageNonce: BigNumber;
  gasLimit: string;
  transactionHash: string;
  blockNumber: number;
};
