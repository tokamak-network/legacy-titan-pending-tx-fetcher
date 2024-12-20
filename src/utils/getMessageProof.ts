import { makeMerkleTreeProof, StateRoot } from "@tokamak-network/titan-sdk";

import { makeStateTrieProof } from "@tokamak-network/titan-sdk";
import { BigNumber, Contract, ethers } from "ethers";
import {
  remove0x,
  encodeCrossDomainMessageV0,
  toHexString,
} from "@tokamak-network/core-utils";
import { PendingWithdrawal } from "../types/graphql";
import * as RLP from "@ethersproject/rlp";
import StateCommitmentChainAbi from "../constant/abis/StateCommitmentChain.json";
import { predeploys } from "@eth-optimism/contracts";

export async function getMessageProof(params: {
  l1Provider: ethers.providers.JsonRpcProvider;
  l2Provider: ethers.providers.JsonRpcProvider;
  pendingWithdrawal: PendingWithdrawal;
}): Promise<any> {
  const { pendingWithdrawal, l1Provider, l2Provider } = params;
  const stateBatchAppended = pendingWithdrawal.stateBatchAppended;
  const l2BlockNumber = Number(pendingWithdrawal.blockNumber);
  const hashData = await l1Provider.getTransaction(
    stateBatchAppended.transactionHash
  );

  const StateCommitmentChain_CONTRACT = new Contract(
    process.env.STATE_COMMITMENT_CHAIN_CONTRACT || "",
    StateCommitmentChainAbi,
    l1Provider
  );

  //step 2
  const [stateRoots] =
    StateCommitmentChain_CONTRACT.interface.decodeFunctionData(
      "appendStateBatch",
      hashData.data
    );

  const stateRootBatch = {
    blockNumber: stateBatchAppended.blockNumber,
    stateRoots,
    header: {
      batchIndex: stateBatchAppended._batchIndex,
      batchRoot: stateBatchAppended._batchRoot,
      batchSize: stateBatchAppended._batchSize,
      prevTotalElements: stateBatchAppended._prevTotalElements,
      extraData: stateBatchAppended._extraData,
    },
  };

  //step3
  const messageSlot = ethers.utils.keccak256(
    ethers.utils.keccak256(
      encodeCrossDomainMessageV0(
        pendingWithdrawal.target,
        pendingWithdrawal.sender,
        pendingWithdrawal.message,
        BigNumber.from(pendingWithdrawal.messageNonce)
      ) + remove0x(predeploys.L2CrossDomainMessenger)
    ) + "00".repeat(32)
  );

  //step4
  const stateTrieProof = await makeStateTrieProof(
    l2Provider as ethers.providers.JsonRpcProvider,
    l2BlockNumber,
    predeploys.OVM_L2ToL1MessagePasser,
    messageSlot
  );

  const messageTxIndex = l2BlockNumber - 1;
  //step5
  const indexInBatch =
    messageTxIndex - Number(stateBatchAppended._prevTotalElements);
  // Just a sanity check.
  if (stateRootBatch.stateRoots.length <= indexInBatch) {
    // Should never happen!
    throw new Error(`state root does not exist in batch`);
  }
  const stateRoot = {
    stateRoot: stateRootBatch.stateRoots[indexInBatch],
    stateRootIndexInBatch: indexInBatch,
    batch: stateRootBatch,
  };

  //step6
  const proof = {
    stateRoot: stateRoot.stateRoot,
    stateRootBatchHeader: stateRoot.batch.header,
    stateRootProof: {
      index: stateRoot.stateRootIndexInBatch,
      siblings: makeMerkleTreeProof(
        stateRoot.batch.stateRoots,
        stateRoot.stateRootIndexInBatch
      ),
    },
    stateTrieWitness: toHexString(RLP.encode(stateTrieProof.accountProof)),
    storageTrieWitness: toHexString(RLP.encode(stateTrieProof.storageProof)),
  };

  return proof;
}
