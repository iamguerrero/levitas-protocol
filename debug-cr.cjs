const { ethers } = require("hardhat");

async function main() {
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const BVIX_ADDRESS = "0xEA3d08a5A5bC48Fc984F0F773826693B7480bF48";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  const [deployer] = await ethers.getSigners();
  
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  const usdc = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const bvix = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  const oracle = await ethers.getContractAt("MockOracle", ORACLE_ADDRESS);
  
  // Current state
  const vaultUSDC = await usdc.balanceOf(NEW_MINT_REDEEM);
  const bvixSupply = await bvix.totalSupply();
  const price = await oracle.getPrice();
  const userUSDC = await usdc.balanceOf(deployer.address);
  
  console.log("Current State:");
  console.log("  Vault USDC:", ethers.formatUnits(vaultUSDC, 6));
  console.log("  BVIX Supply:", ethers.formatUnits(bvixSupply, 18));
  console.log("  BVIX Price:", ethers.formatUnits(price, 18));
  console.log("  User USDC:", ethers.formatUnits(userUSDC, 6));
  
  // Get current CR
  const currentCR = await mintRedeem.getCollateralRatio();
  console.log("  Current CR:", currentCR.toString() + "%");
  
  // Calculate what happens when we mint 100 USDC
  const mintAmount = ethers.parseUnits("100", 6);
  const netAmount = mintAmount - ((mintAmount * 30n) / 10000n);
  const bvixToMint = (netAmount * ethers.parseUnits("1", 30)) / price;
  
  console.log("\nMint Simulation (100 USDC):");
  console.log("  Net amount (after fee):", ethers.formatUnits(netAmount, 6));
  console.log("  BVIX to mint:", ethers.formatUnits(bvixToMint, 18));
  
  // Calculate future CR
  const futureVaultUSDC = vaultUSDC + mintAmount;
  const futureBvixSupply = bvixSupply + bvixToMint;
  
  console.log("\nFuture State:");
  console.log("  Future Vault USDC:", ethers.formatUnits(futureVaultUSDC, 6));
  console.log("  Future BVIX Supply:", ethers.formatUnits(futureBvixSupply, 18));
  
  // Manual CR calculation
  const futureVaultUSDC18 = futureVaultUSDC * ethers.parseUnits("1", 12);
  const futureBvixValueUSD = (futureBvixSupply * price) / ethers.parseUnits("1", 18);
  const futureCR = (futureVaultUSDC18 * 100n) / futureBvixValueUSD;
  
  console.log("  Future CR:", futureCR.toString() + "%");
  console.log("  Min CR required: 120%");
  console.log("  Will pass CR check:", futureCR >= 120n ? "YES" : "NO");
  
  // Check if we can actually call the mint function
  try {
    const tx = await mintRedeem.mint.staticCall(mintAmount);
    console.log("\nMint would succeed!");
  } catch (error) {
    console.log("\nMint would fail:", error.message);
  }
}

main().catch(console.error);