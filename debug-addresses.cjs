const { ethers } = require("hardhat");

async function main() {
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const MINT_REDEEM_ADDRESS = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const [user] = await ethers.getSigners();
  
  console.log("=== ADDRESS CLARIFICATION ===");
  console.log("Your wallet address:", user.address);
  console.log("MintRedeem contract (vault):", MINT_REDEEM_ADDRESS);
  console.log("USDC contract:", MOCK_USDC_ADDRESS);
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check both balances
  const yourBalance = await usdcContract.balanceOf(user.address);
  const vaultBalance = await usdcContract.balanceOf(MINT_REDEEM_ADDRESS);
  
  console.log("\n=== USDC BALANCES ===");
  console.log("Your personal wallet:", ethers.formatUnits(yourBalance, 6), "USDC");
  console.log("Vault contract:", ethers.formatUnits(vaultBalance, 6), "USDC");
  
  console.log("\n=== WHAT THIS MEANS ===");
  if (yourBalance == 0) {
    console.log("• You sent all your USDC to the vault to fix collateral ratio");
    console.log("• The vault now has 2000 USDC (good for CR!)");
    console.log("• But your wallet has 0 USDC left for new mints");
    console.log("• You need more USDC in your personal wallet to mint tokens");
  } else {
    console.log("• You have USDC in your wallet for minting");
  }
}

main().catch(console.error);