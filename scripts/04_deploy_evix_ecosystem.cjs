const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying EVIX ecosystem with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy EVIX Oracle with initial price of $37.98
  const EVIXOracle = await ethers.getContractFactory("EVIXOracle");
  const evixOracle = await EVIXOracle.deploy(
    ethers.parseEther("37.98"), // Initial price
    deployer.address
  );
  await evixOracle.waitForDeployment();
  const evixOracleAddress = await evixOracle.getAddress();
  console.log("EVIX Oracle deployed to:", evixOracleAddress);

  // Deploy EVIX MintRedeem contract
  const EVIXMintRedeem = await ethers.getContractFactory("EVIXMintRedeem");
  const evixMintRedeem = await EVIXMintRedeem.deploy(
    "0x79640e0f510a7c6d59737442649d9600C84b035f", // Mock USDC
    "0x37e3b45fEF91D54Ef4992B71382EC36307908463", // EVIX Token
    evixOracleAddress, // EVIX Oracle
    deployer.address
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("EVIX MintRedeem deployed to:", evixMintRedeemAddress);

  // Transfer EVIX ownership to MintRedeem contract
  const evixToken = await ethers.getContractAt("EVIXToken", "0x37e3b45fEF91D54Ef4992B71382EC36307908463");
  await evixToken.transferOwnership(evixMintRedeemAddress);
  console.log("EVIX ownership transferred to MintRedeem contract");

  console.log("\n--- For README ---");
  console.log(`| EVIX Oracle | ${evixOracleAddress} | Price feed for EVIX token |`);
  console.log(`| EVIX MintRedeem | ${evixMintRedeemAddress} | Mint/Redeem contract for EVIX |`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});