import { ethers } from "ethers";
import { BridgeService } from "./services/bridge.service";
import { CrossChainService } from "./services/crossChain.service";
import { FileStorageService } from "./services/fileStorage.service";
import { getMessageProof } from "./utils/getMessageProof";

async function main() {
  try {
    const timestamp = new Date().getTime();
    const storageDir = `storage/${process.env.NETWORK}/${timestamp}`;

    // Create storage directory if it doesn't exist
    await FileStorageService.createDirectory(storageDir);

    console.log("Fetching withdrawal initiated messages...");
    const withdrawalInitiated = await BridgeService.getWithdrawalInitiated();
    await FileStorageService.writeToFile(
      `${storageDir}/withdrawalInitiated.json`,
      withdrawalInitiated
    );
    console.log("Fetched withdrawal initiated messages!");

    console.log("Fetching sent messages...");
    const sentMessages = await BridgeService.getL2SentMessages(
      withdrawalInitiated
    );
    await FileStorageService.writeToFile(
      `${storageDir}/sentMessages.json`,
      sentMessages
    );
    console.log("Fetched sent messages!");

    console.log("Generating roll up messages...");
    const rollUpMessages = CrossChainService.getRollUpMessages(sentMessages);
    await FileStorageService.writeToFile(
      `${storageDir}/rollUpMessages.json`,
      rollUpMessages
    );
    console.log("Generated roll up messages!");

    console.log("Fetching state batch appended...");
    const stateBatchAppendeds = await BridgeService.getStateBatchAppended();
    await FileStorageService.writeToFile(
      `${storageDir}/stateBatchAppended.json`,
      stateBatchAppendeds
    );
    console.log("Fetched state batch appended!");

    console.log("Fetching relayed withdrawal...");
    const relayedWithdrawals = await BridgeService.getRelayedWithdrawals();
    await FileStorageService.writeToFile(
      `${storageDir}/relayedWithdrawals.json`,
      relayedWithdrawals
    );
    console.log("Fetched relayed withdrawal!");

    const pendingWithdrawals = await BridgeService.getPendingWithdrawals(
      rollUpMessages,
      stateBatchAppendeds,
      relayedWithdrawals
    );
    await FileStorageService.writeToFile(
      `${storageDir}/pendingWithdrawals.json`,
      pendingWithdrawals
    );

    console.log("Generating final withdrawals...");
    const finalWithdrawals = await BridgeService.getFinalWithdrawals(
      pendingWithdrawals
    );
    await FileStorageService.writeToFile(
      `${storageDir}/finalWithdrawals.json`,
      finalWithdrawals
    );
    console.log("Generated final withdrawals!");

    console.log("Generating final withdrawal inputs...");
    const finalWithdrawalInputs = finalWithdrawals.map((finalWithdrawal) =>
      BridgeService.getFinalWithdrawalInput(finalWithdrawal)
    );
    await FileStorageService.writeToFile(
      `${storageDir}/finalWithdrawalInputs.json`,
      finalWithdrawalInputs
    );
    console.log("Generated final withdrawal inputs!");
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main();
