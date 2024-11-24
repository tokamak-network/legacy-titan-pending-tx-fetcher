import { gql } from "graphql-request";

export const GET_L2_SENT_MESSAGES = gql`
  query sentMessages($L1Bridge: String, $blockNumber_gte: String, $first: Int) {
    sentMessages(
      where: { target: $L1Bridge, blockNumber_gte: $blockNumber_gte }
      orderBy: blockNumber
      orderDirection: asc
      first: $first
    ) {
      id
      target
      sender
      message
      messageNonce
      gasLimit
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_L2_WITHDRAWAL_INITIATED = gql`
  query withdrawalInitiateds($blockNumber_gte: String, $first: Int) {
    withdrawalInitiateds(
      where: { blockNumber_gte: $blockNumber_gte }
      orderBy: blockNumber
      orderDirection: asc
      first: $first
    ) {
      id
      _l1Token
      _l2Token
      _from
      _to
      _amount
      _data
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_RELAYED_WITHDRAWAL = gql`
  query relayedMessages($blockNumber_gte: String, $first: Int) {
    relayedMessages(
      where: { blockNumber_gte: $blockNumber_gte }
      orderBy: blockNumber
      orderDirection: asc
      first: $first
    ) {
      id
      msgHash
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_STATE_BATCH_APPENDED = gql`
  query stateBatchAppendeds($blockNumber_gte: String, $first: Int) {
    stateBatchAppendeds(
      where: { blockNumber_gte: $blockNumber_gte }
      orderBy: blockNumber
      orderDirection: asc
      first: $first
    ) {
      id
      _batchIndex
      _batchRoot
      _batchSize
      _prevTotalElements
      _extraData
      blockNumber
      blockTimestamp
      transactionHash
      rollUpBatch
    }
  }
`;
