const { ethers } = require("hardhat");

async function main() {
  console.log("=== ANALYZING THE ALLOWANCE ERROR ===");
  
  // The error shows ERC20InsufficientAllowance with:
  // - Spender: 0xb507A6743787E1Ee10365385F46DD5BFEa10Dcd5 (MintRedeemV4)
  // - Current allowance: 0
  // - Required: 100000000 (100 USDC)
  
  const FINAL_MINT_REDEEM = "0xb507A6743787E1Ee10365385F46DD5BFEa10Dcd5";
  const FINAL_BVIX = "0x4Cd0c0ed02363F27fC2A8a3D7dC9aEA88ddCCf5E";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  console.log("The error is ERC20InsufficientAllowance");
  console.log("This means the USER needs to approve USDC spending by MintRedeemV4");
  console.log("The error is NOT about BVIX token minting");
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check user's allowance
  const allowance = await usdcContract.allowance(USER_ADDRESS, FINAL_MINT_REDEEM);
  console.log("User allowance:", ethers.formatUnits(allowance, 6), "USDC");
  
  // Check user's balance
  const balance = await usdcContract.balanceOf(USER_ADDRESS);
  console.log("User balance:", ethers.formatUnits(balance, 6), "USDC");
  
  console.log("\n=== SOLUTION ===");
  console.log("The user needs to approve USDC spending in MetaMask");
  console.log("The frontend should be handling this automatically");
  console.log("Let me check if there's an issue with the approval flow");
  
  // The issue might be that the frontend is doing the static call BEFORE approval
  // Let's check the web3.ts file to see the flow
  
  console.log("\n=== FRONTEND FLOW ANALYSIS ===");
  console.log("1. User clicks mint");
  console.log("2. Frontend calls mintBVIX function");
  console.log("3. mintBVIX checks balance and allowance");
  console.log("4. mintBVIX approves USDC if needed");
  console.log("5. mintBVIX does staticCall to test mint");
  console.log("6. mintBVIX does actual mint");
  
  console.log("\n=== LIKELY ISSUE ===");
  console.log("The staticCall at step 5 is failing because approval hasn't happened yet");
  console.log("Even though the code shows approval at step 4, the staticCall might be");
  console.log("running before the approval is confirmed on chain");
  
  console.log("\n=== QUICK FIX ===");
  console.log("I need to remove the staticCall or move it after approval confirmation");
  console.log("The staticCall is meant to prevent failed transactions, but it's");
  console.log("running too early in the flow");
}

main().catch(console.error);