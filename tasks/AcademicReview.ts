import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Task to interact with the AcademicReview contract
 * Examples:
 *   npx hardhat paper:info --address <CONTRACT_ADDRESS>
 *   npx hardhat paper:count --address <CONTRACT_ADDRESS>
 */
task("paper:info", "Get information about the AcademicReview contract")
  .addParam("address", "The address of the AcademicReview contract")
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const academicReview = await ethers.getContractAt("AcademicReview", args.address);

    console.log("\n=== AcademicReview Contract Info ===");
    console.log("Contract Address:", args.address);

    try {
      const [totalPapers, totalReviews] = await academicReview.getTotalCounts();
      console.log("Total Papers:", totalPapers.toString());
      console.log("Total Reviews:", totalReviews.toString());
    } catch (error) {
      console.error("Error fetching contract info:", error);
    }

    console.log("====================================\n");
  });

/**
 * Task to get the count of papers and reviews
 */
task("paper:count", "Get the count of papers and reviews")
  .addParam("address", "The address of the AcademicReview contract")
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const academicReview = await ethers.getContractAt("AcademicReview", args.address);

    try {
      const [totalPapers, totalReviews] = await academicReview.getTotalCounts();
      console.log("\n=== Statistics ===");
      console.log("Papers Submitted:", totalPapers.toString());
      console.log("Reviews Submitted:", totalReviews.toString());
      console.log("==================\n");
    } catch (error) {
      console.error("Error:", error);
    }
  });
