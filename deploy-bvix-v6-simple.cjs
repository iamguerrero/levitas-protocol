const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BVIX MintRedeem V6...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  try {
    const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
    console.log("Contract factory created");
    
    const bvixV6 = await MintRedeemV6.deploy(
      "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297", // MockUSDC
      "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09", // BVIXToken
      "0x85485dD6cFaF5220150c413309C61a8EA24d24FE", // MockOracle
      deployer.address
    );
    console.log("Deployment transaction sent");
    
    await bvixV6.waitForDeployment();
    const address = await bvixV6.getAddress();
    console.log("✅ BVIX MintRedeem V6 deployed to:", address);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch(console.error); 