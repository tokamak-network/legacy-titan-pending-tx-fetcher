import { ethers } from "ethers";
import { l1GraphqlClient, l2GraphqlClient } from "../config/graphql-client";
import {
  GET_L2_SENT_MESSAGES,
  GET_L2_WITHDRAWAL_INITIATED,
  GET_RELAYED_WITHDRAWAL,
  GET_STATE_BATCH_APPENDED,
} from "../graphql/queries";
import {
  FinalWithdrawal,
  FinalWithdrawalInput,
  PendingWithdrawal,
  RelayedWithdrawal,
  RelayedWithdrawalResponse,
  RollUpMessage,
  SentMessage,
  SentMessageResponse,
  SentMessageVars,
  SentMessageWithAddress,
  StateBatchAppended,
  StateBatchAppendedResponse,
  StateBatchAppendedVars,
  WithdrawalInitiated,
  WithdrawalInitiatedResponse,
  WithdrawalInitiatedVars,
} from "../types/graphql";
import { getMessageProof } from "../utils/getMessageProof";

export class BridgeService {
  static async getL2SentMessages(
    withdrawalInitiated: WithdrawalInitiated[]
  ): Promise<SentMessageWithAddress[]> {
    try {
      let allSentMessages: SentMessageWithAddress[] = [];
      let currentBlock = 0;
      const batchSize = 1000;

      while (true) {
        const variables: SentMessageVars = {
          L1Bridge: process.env.L1_STANDARD_BRIDGE_CONTRACT || "",
          blockNumber_gte: currentBlock.toString(),
          first: batchSize,
        };

        const response = await l2GraphqlClient.request<SentMessageResponse>(
          GET_L2_SENT_MESSAGES,
          variables
        );

        const sentMessages = response.sentMessages;
        if (sentMessages.length === 0) break;

        const messagesWithAddress = sentMessages
          .map((message: SentMessage) => {
            const matchingWithdrawal = withdrawalInitiated.find(
              (withdrawal: WithdrawalInitiated) =>
                withdrawal.transactionHash == message.transactionHash
            );
            if (!matchingWithdrawal) return null;
            return {
              ...message,
              account: matchingWithdrawal._from || "",
            };
          })
          .filter((message) => message !== null);

        allSentMessages = [...allSentMessages, ...messagesWithAddress];

        currentBlock =
          parseInt(sentMessages[sentMessages.length - 1].blockNumber) + 1;
      }

      return allSentMessages;
    } catch (error) {
      console.error("Error fetching l2 sentMessages:", error);
      throw error;
    }
  }

  static async getWithdrawalInitiated(): Promise<WithdrawalInitiated[]> {
    try {
      let allWithdrawals: WithdrawalInitiated[] = [];
      let currentBlock = 0;
      const batchSize = 1000;

      while (true) {
        const variables: WithdrawalInitiatedVars = {
          blockNumber_gte: currentBlock.toString(),
          first: batchSize,
        };

        const response =
          await l2GraphqlClient.request<WithdrawalInitiatedResponse>(
            GET_L2_WITHDRAWAL_INITIATED,
            variables
          );

        const withdrawals = response.withdrawalInitiateds;
        if (withdrawals.length === 0) break;

        allWithdrawals = [...allWithdrawals, ...withdrawals];

        currentBlock =
          parseInt(withdrawals[withdrawals.length - 1].blockNumber) + 1;
      }

      return allWithdrawals;
    } catch (error) {
      console.error("Error fetching l2 withdrawalInitiated:", error);
      throw error;
    }
  }

  static async getRelayedWithdrawal(
    msgHash: string
  ): Promise<RelayedWithdrawal[]> {
    try {
      let allRelayedWithdrawals: RelayedWithdrawal[] = [];
      let currentBlock = 0;
      const batchSize = 1000;

      while (true) {
        const variables = {
          msgHash,
          blockNumber_gte: currentBlock.toString(),
          first: batchSize,
        };

        const response =
          await l1GraphqlClient.request<RelayedWithdrawalResponse>(
            GET_RELAYED_WITHDRAWAL,
            variables
          );

        const relayedMessages = response.relayedMessages;
        if (relayedMessages.length === 0) break;

        allRelayedWithdrawals = [...allRelayedWithdrawals, ...relayedMessages];

        currentBlock =
          parseInt(relayedMessages[relayedMessages.length - 1].blockNumber) + 1;
      }

      return allRelayedWithdrawals;
    } catch (error) {
      console.error("Error fetching relayedWithdrawal:", error);
      throw error;
    }
  }

  static async getRelayedWithdrawals(): Promise<RelayedWithdrawal[]> {
    try {
      let allRelayedWithdrawals: RelayedWithdrawal[] = [];
      let currentBlock = 0;
      const batchSize = 1000;

      while (true) {
        const variables = {
          blockNumber_gte: currentBlock.toString(),
          first: batchSize,
        };

        const response =
          await l1GraphqlClient.request<RelayedWithdrawalResponse>(
            GET_RELAYED_WITHDRAWAL,
            variables
          );

        const relayedMessages = response.relayedMessages;
        if (relayedMessages.length === 0) break;

        allRelayedWithdrawals = [...allRelayedWithdrawals, ...relayedMessages];

        currentBlock =
          parseInt(relayedMessages[relayedMessages.length - 1].blockNumber) + 1;
      }

      return allRelayedWithdrawals;
    } catch (error) {
      console.error("Error fetching relayedWithdrawals:", error);
      throw error;
    }
  }

  static async getPendingWithdrawals(
    rollUpMessages: RollUpMessage[],
    stateBatchAppendeds: StateBatchAppended[],
    relayedMessages: RelayedWithdrawal[]
  ): Promise<PendingWithdrawal[]> {
    try {
      let allPendingWithdrawals: PendingWithdrawal[] = [];
      let currentBlock = 0;
      const batchSize = 1000;

      const filteredMessages = rollUpMessages.flatMap((msg: RollUpMessage) => {
        if (
          relayedMessages.find(
            (relayedMsg: RelayedWithdrawal) =>
              relayedMsg.msgHash === msg.msgHash
          )
        ) {
          return [];
        }
        const stateBatchAppended = stateBatchAppendeds.find(
          (stateBatchAppended: StateBatchAppended) =>
            Number(stateBatchAppended.rollUpBatch) >= Number(msg.blockNumber) &&
            Number(msg.blockNumber) >
              Number(stateBatchAppended._prevTotalElements)
        );
        if (!stateBatchAppended) return [];
        return {
          ...msg,
          stateBatchAppended,
        };
      });

      while (currentBlock < filteredMessages.length) {
        const batch = filteredMessages.slice(
          currentBlock,
          currentBlock + batchSize
        );
        if (batch.length === 0) break;

        allPendingWithdrawals = [...allPendingWithdrawals, ...batch];
        currentBlock += batchSize;
      }

      return allPendingWithdrawals;
    } catch (error) {
      console.error("Error getting pending withdrawals:", error);
      throw error;
    }
  }

  static async getStateBatchAppended(): Promise<StateBatchAppended[]> {
    try {
      let allStateBatchAppended: StateBatchAppended[] = [];
      let currentBlock = 0;
      const batchSize = 1000;
      while (true) {
        const variables: StateBatchAppendedVars = {
          blockNumber_gte: currentBlock.toString(),
          first: batchSize,
        };

        const response =
          await l1GraphqlClient.request<StateBatchAppendedResponse>(
            GET_STATE_BATCH_APPENDED,
            variables
          );

        const stateBatchAppended = response.stateBatchAppendeds;
        if (stateBatchAppended.length === 0) break;

        allStateBatchAppended = [
          ...allStateBatchAppended,
          ...stateBatchAppended,
        ];

        currentBlock =
          parseInt(
            stateBatchAppended[stateBatchAppended.length - 1].blockNumber
          ) + 1;
      }

      return allStateBatchAppended;
    } catch (error) {
      console.error("Error fetching stateBatchAppended:", error);
      throw error;
    }
  }

  static async getFinalWithdrawals(
    pendingWithdrawals: PendingWithdrawal[]
  ): Promise<FinalWithdrawal[]> {
    const l1Provider = new ethers.providers.JsonRpcProvider(
      process.env.L1_RPC_URL,
      Number(process.env.L1_CHAIN_ID)
    );

    const l2Provider = new ethers.providers.JsonRpcProvider(
      process.env.L2_RPC_URL,
      Number(process.env.L2_CHAIN_ID)
    );
    return await Promise.all(
      pendingWithdrawals.map(async (pendingWithdrawal) => {
        const proof = await getMessageProof({
          l1Provider,
          l2Provider,
          pendingWithdrawal,
        });
        return {
          ...pendingWithdrawal,
          proof,
        };
      })
    );
  }
  static getFinalWithdrawalInput(
    finalWithdrawal: FinalWithdrawal
  ): FinalWithdrawalInput {
    return {
      account: finalWithdrawal.account,
      target: finalWithdrawal.target,
      sender: finalWithdrawal.sender,
      message: finalWithdrawal.message,
      messageNonce: finalWithdrawal.messageNonce,
      proof: finalWithdrawal.proof,
    };
  }
}
