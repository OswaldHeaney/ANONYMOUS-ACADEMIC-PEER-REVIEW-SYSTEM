import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy the AcademicReview contract
 */
const deployAcademicReview: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying AcademicReview contract...");
  console.log("Deployer address:", deployer);

  const academicReview = await deploy("AcademicReview", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("AcademicReview deployed to:", academicReview.address);

  // Also deploy the alternative implementations for completeness
  const academicEvaluation = await deploy("AcademicEvaluation", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("AcademicEvaluation deployed to:", academicEvaluation.address);

  const zlethWrapper = await deploy("ZLETHWrapper", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("ZLETHWrapper deployed to:", zlethWrapper.address);

  const zamaLinkCampaign = await deploy("ZamaLinkCampaign", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("ZamaLinkCampaign deployed to:", zamaLinkCampaign.address);

  console.log("All contracts deployed successfully!");

  // Log deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("AcademicReview:", academicReview.address);
  console.log("AcademicEvaluation:", academicEvaluation.address);
  console.log("ZLETHWrapper:", zlethWrapper.address);
  console.log("ZamaLinkCampaign:", zamaLinkCampaign.address);
  console.log("========================\n");
};

deployAcademicReview.tags = ["AcademicReview"];
export default deployAcademicReview;
