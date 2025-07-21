const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Hardhat...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Balance:", ethers.formatEther(await deployer.getBalance()), "ETH");
    console.log("✅ Hardhat is working!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  }); 