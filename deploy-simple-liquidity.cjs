const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting simple liquidity pool deployment on ETH Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy BVIX Token
  console.log("\n📦 Deploying BVIX Token...");
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("BVIX Token deployed to:", bvixAddress);

  // Deploy Mock USDC
  console.log("\n📦 Deploying Mock USDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy(deployer.address);
  await mockUsdc.waitForDeployment();
  const usdcAddress = await mockUsdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // Mint some tokens for liquidity
  console.log("\n💰 Minting tokens for liquidity...");
  const bvixAmount = ethers.parseEther("1000000"); // 1M BVIX
  
  await bvixToken.mint(deployer.address, bvixAmount);
  console.log("Minted", ethers.formatEther(bvixAmount), "BVIX");
  
  const usdcBalance = await mockUsdc.balanceOf(deployer.address);
  console.log("USDC balance:", ethers.formatUnits(usdcBalance, 6));

  // Create a simple liquidity pool using Uniswap V2 style approach
  // For now, let's just save the addresses and provide instructions for manual liquidity addition
  
  const addresses = {
    bvixToken: bvixAddress,
    mockUsdc: usdcAddress,
    deployer: deployer.address,
    network: "sepolia",
    bvixAmount: ethers.formatEther(bvixAmount),
    usdcAmount: ethers.formatUnits(usdcBalance, 6)
  };

  console.log("\n📋 Deployment Summary:");
  console.log("BVIX Token:", bvixAddress);
  console.log("Mock USDC:", usdcAddress);
  console.log("Deployer:", deployer.address);
  console.log("BVIX Amount:", ethers.formatEther(bvixAmount));
  console.log("USDC Amount:", ethers.formatUnits(usdcBalance, 6));

  // Save to file
  const fs = require('fs');
  fs.writeFileSync('token-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n✅ Addresses saved to token-addresses.json");

  console.log("\n🎉 Token deployment complete!");
  console.log("\n📝 Next steps to add liquidity:");
  console.log("1. Visit Uniswap V3 on Sepolia: https://app.uniswap.org/");
  console.log("2. Connect your wallet");
  console.log("3. Go to 'Pool' tab");
  console.log("4. Click 'New Position'");
  console.log("5. Select BVIX and USDC tokens");
  console.log("6. Set fee tier to 0.3%");
  console.log("7. Add liquidity with the amounts above");
  console.log("\n🔗 Uniswap V3 Sepolia: https://app.uniswap.org/");
  console.log("🔗 Sepolia Etherscan: https://sepolia.etherscan.io/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 