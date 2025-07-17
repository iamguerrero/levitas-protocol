const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Redeploying EVIX V5 with fixed decimals...");
  
  const [deployer] = await ethers.getSigners();
  
  // Contract addresses
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const EVIX_TOKEN_ADDRESS = "0x37e3b45fEF91D54Ef4992B71382EC36307908463";
  const EVIX_ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";

  try {
    // Deploy fixed EVIX MintRedeem V5
    console.log("🏗️ Deploying fixed EVIX MintRedeem V5...");
    const EVIXMintRedeemV5Simple = await ethers.getContractFactory("EVIXMintRedeemV5Simple");
    const evixMintRedeemV5 = await EVIXMintRedeemV5Simple.deploy(
      MOCK_USDC_ADDRESS,
      EVIX_TOKEN_ADDRESS,
      EVIX_ORACLE_ADDRESS,
      deployer.address
    );
    await evixMintRedeemV5.waitForDeployment();
    const evixMintRedeemV5Address = await evixMintRedeemV5.getAddress();
    console.log("✅ Fixed EVIX MintRedeem V5 deployed to:", evixMintRedeemV5Address);

    console.log("\n📝 Update EVIX_MINT_REDEEM_ADDRESS to:", evixMintRedeemV5Address);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

main().catch(console.error);