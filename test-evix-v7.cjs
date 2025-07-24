const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing EVIX V7 minting step by step...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  // Contract addresses from deployment
  const EVIX_ADDRESS = "0x4aF89b302898f3BbDc6aa29B4cAc517A0A0CA927";
  const EVIX_MINT_REDEEM_ADDRESS = "0x90567a77E2De28e7465049C953C9B520C810e1e9";
  const USDC_ADDRESS = "0xAC889Aa794Cc94ce6ba6826883A91d0278f49D41"; // Use the correct MockUSDC address
  const ORACLE_ADDRESS = "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F";
  
  // Get contract instances
  const evixToken = await ethers.getContractAt("EVIXToken", EVIX_ADDRESS);
  const evixMintRedeem = await ethers.getContractAt("EVIXMintRedeemV7", EVIX_MINT_REDEEM_ADDRESS);
  const mockUSDC = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const oracle = await ethers.getContractAt("PriceOracle", ORACLE_ADDRESS);
  
  console.log("\n📊 Checking contract states...");
  
  // Check EVIX token
  const evixName = await evixToken.name();
  const evixSymbol = await evixToken.symbol();
  console.log("EVIX Token:", evixName, "(", evixSymbol, ")");
  
  // Check MINTER_ROLE
  const MINTER_ROLE = await evixToken.MINTER_ROLE();
  const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
  console.log("MintRedeem has MINTER_ROLE:", hasMinterRole);
  
  // Check USDC balance
  const usdcBalance = await mockUSDC.balanceOf(deployer.address);
  console.log("USDC balance:", ethers.formatUnits(usdcBalance, 6));
  
  // Check oracle price
  const oraclePrice = await oracle.getPrice();
  console.log("Oracle price:", ethers.formatUnits(oraclePrice, 6));
  
  // Check EVIX total supply
  const evixTotalSupply = await evixToken.totalSupply();
  console.log("EVIX total supply:", ethers.formatEther(evixTotalSupply));
  
  // Check MintRedeem contract state
  const totalCollateral = await evixMintRedeem.totalCollateral();
  const totalDebt = await evixMintRedeem.totalDebt();
  const collateralRatio = await evixMintRedeem.getCollateralRatio();
  console.log("MintRedeem total collateral:", ethers.formatUnits(totalCollateral, 6));
  console.log("MintRedeem total debt:", ethers.formatEther(totalDebt));
  console.log("MintRedeem collateral ratio:", collateralRatio.toString());
  
  // Step 1: Get USDC from faucet if needed
  if (usdcBalance < ethers.parseUnits("100", 6)) {
    console.log("\n💰 Getting USDC from faucet...");
    try {
      const faucetTx = await mockUSDC.faucet();
      await faucetTx.wait();
      console.log("✅ USDC faucet successful");
      
      const newBalance = await mockUSDC.balanceOf(deployer.address);
      console.log("New USDC balance:", ethers.formatUnits(newBalance, 6));
    } catch (error) {
      console.error("❌ USDC faucet failed:", error.message);
      return;
    }
  }
  
  // Step 2: Approve USDC
  console.log("\n✅ Approving USDC...");
  try {
    const approveTx = await mockUSDC.approve(EVIX_MINT_REDEEM_ADDRESS, ethers.parseUnits("100", 6));
    await approveTx.wait();
    console.log("✅ USDC approved successfully");
  } catch (error) {
    console.error("❌ USDC approval failed:", error.message);
    return;
  }
  
  // Step 3: Test mint with small amount first
  console.log("\n🧪 Testing mint with 10 USDC at 150% CR...");
  try {
    const mintTx = await evixMintRedeem.mintWithCollateralRatio(
      ethers.parseUnits("10", 6), // 10 USDC
      150 // 150% CR
    );
    await mintTx.wait();
    console.log("✅ Test mint successful!");
    
    // Check results
    const newEvixBalance = await evixToken.balanceOf(deployer.address);
    const newCollateralRatio = await evixMintRedeem.getCollateralRatio();
    const userCR = await evixMintRedeem.getUserCollateralRatio(deployer.address);
    
    console.log("EVIX balance after mint:", ethers.formatEther(newEvixBalance));
    console.log("Global collateral ratio:", newCollateralRatio.toString());
    console.log("User collateral ratio:", userCR.toString());
    
  } catch (error) {
    console.error("❌ Test mint failed:", error.message);
    
    // Try to get more details about the revert
    try {
      const tx = await evixMintRedeem.mintWithCollateralRatio.populateTransaction(
        ethers.parseUnits("10", 6),
        150
      );
      console.log("Transaction data:", tx);
    } catch (populateError) {
      console.error("Populate transaction failed:", populateError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 