import { ethers } from "hardhat";

async function main() {
  console.log("Getting deployed contract addresses on Sepolia...");
  
  // You'll need to replace these with the actual addresses from your deployment
  // For now, let's create a template that you can fill in
  
  const addresses = {
    mockUSDC: "0x...", // Replace with actual MockUSDC address
    bvixOracle: "0x...", // Replace with actual BVIX Oracle address
    evixOracle: "0x...", // Replace with actual EVIX Oracle address
    bvixToken: "0x...", // Replace with actual BVIX Token address
    evixToken: "0x...", // Replace with actual EVIX Token address
    bvixMintRedeem: "0x...", // Replace with actual BVIX MintRedeem address
    evixMintRedeem: "0x..." // Replace with actual EVIX MintRedeem address
  };
  
  console.log("Sepolia Contract Addresses:");
  console.log(JSON.stringify(addresses, null, 2));
  
  console.log("\nTo update the frontend, replace the placeholder addresses in:");
  console.log("client/src/lib/web3.ts - ADDRESSES[CHAIN_IDS.sepolia] section");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 