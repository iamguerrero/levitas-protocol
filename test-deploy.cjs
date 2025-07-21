const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing deployment setup...");
  
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("✅ Got signer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("✅ Account balance:", hre.ethers.formatEther(balance), "ETH");
    
    const network = await hre.ethers.provider.getNetwork();
    console.log("✅ Connected to network:", network.name, "Chain ID:", network.chainId);
    
    console.log("✅ Ready to deploy!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 