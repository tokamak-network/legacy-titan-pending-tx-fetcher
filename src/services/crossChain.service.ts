import {
  CrossChainMessageProof,
  hashCrossChainMessage,
} from "@tokamak-network/titan-sdk";
import {
  RollUpMessage,
  SentMessage,
  SentMessageWithAddress,
} from "../types/graphql";
import { BigNumber, Bytes, ethers } from "ethers";
import { BatchCrossChainMessenger } from "@tokamak-network/titan-sdk";

export class CrossChainService {
  static getCrossChainMessageHash = (
    message: SentMessageWithAddress
  ): string => {
    return hashCrossChainMessage({
      sender: message.sender,
      target: message.target,
      message: message.message,
      messageNonce: BigNumber.from(message.messageNonce),
      minGasLimit: BigNumber.from(0),
      value: BigNumber.from(0),
    });
  };

  static getRollUpMessages = (
    messages: SentMessageWithAddress[]
  ): RollUpMessage[] => {
    return messages.map((message) => {
      return {
        ...message,
        msgHash: CrossChainService.getCrossChainMessageHash(message),
      };
    });
  };

  static getRelayMessageProof = async (
    transactionHash: string
  ): Promise<CrossChainMessageProof> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(
      process.env.L1_RPC_URL,
      Number(process.env.L1_CHAIN_ID)
    );
    const l2Provider = new ethers.providers.JsonRpcProvider(
      process.env.L2_RPC_URL,
      Number(process.env.L2_CHAIN_ID)
    );
    const crossDomainMessenger = new BatchCrossChainMessenger({
      l1SignerOrProvider: l1Provider,
      l2SignerOrProvider: l2Provider,
      l1ChainId: Number(process.env.L1_CHAIN_ID),
      l2ChainId: Number(process.env.L2_CHAIN_ID),
    });
    return await crossDomainMessenger.getMessageProof(transactionHash);
  };
}
