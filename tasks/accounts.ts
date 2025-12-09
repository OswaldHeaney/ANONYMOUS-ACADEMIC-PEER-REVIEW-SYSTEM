import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Task to display all available accounts
 */
task("accounts", "Prints the list of accounts", async (args, hre: HardhatRuntimeEnvironment) => {
  const accounts = await hre.ethers.getSigners();

  console.log("\n=== Available Accounts ===\n");
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(`Account ${i}: ${account.address}`);
    console.log(`  Balance: ${hre.ethers.formatEther(balance)} ETH\n`);
  }
});
