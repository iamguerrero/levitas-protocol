const { ethers } = require("hardhat");

async function main() {
  console.log("=== BOOTSTRAPPING VAULT WITH INITIAL COLLATERAL ===");
  
  const NEW_MINT_REDEEM = "0xCC9A824EF39a8925581616ad41ee61C8Bb43D6DF";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  // Try to bootstrap the vault by doing the first mint directly
  // This will establish the initial collateral ratio
  
  const [deployer] = await ethers.getSigners();
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  
  // Check if deployer has any USDC
  const deployerBalance = await usdcContract.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.formatUnits(deployerBalance, 6));
  
  // Check user balance
  const userBalance = await usdcContract.balanceOf(USER_ADDRESS);
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  
  // Check current vault state
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  
  // For a fresh vault, we need to do the first mint with a large enough amount
  // Let's calculate what amount would work
  
  const price = await mintRedeem.oracle().then(addr => 
    ethers.getContractAt("MockOracle", addr)
  ).then(oracle => oracle.getPrice());
  
  console.log("Oracle price:", ethers.formatEther(price));
  
  // For minimum 120% collateral ratio, we need:
  // USDC_value >= 1.2 * BVIX_value
  // For 100 USDC mint, we get ~2.37 BVIX at $42.15 price
  // BVIX value = 2.37 * 42.15 = ~100 USD
  // So 100 USDC should work for 120% ratio
  
  // The issue might be that the vault needs some initial collateral
  // Let's try a smaller amount first
  
  console.log("\n=== TESTING DIFFERENT MINT AMOUNTS ===");
  
  const testAmounts = [
    ethers.parseUnits("10", 6),   // 10 USDC
    ethers.parseUnits("50", 6),   // 50 USDC
    ethers.parseUnits("100", 6),  // 100 USDC
    ethers.parseUnits("200", 6),  // 200 USDC
  ];
  
  for (const amount of testAmounts) {
    try {
      const result = await mintRedeem.mint.staticCall(amount);
      console.log(`✅ ${ethers.formatUnits(amount, 6)} USDC would work - mint ${ethers.formatEther(result)} BVIX`);
      
      // Calculate the resulting collateral ratio
      const bvixToMint = result;
      const futureVaultUSDC = vaultBalance + amount;
      const futureSupply = bvixToMint;
      
      const futureVaultUSDC18 = futureVaultUSDC * BigInt(1e12);
      const futureBvixValueUSD = (futureSupply * price) / BigInt(1e18);
      const futureRatio = (futureVaultUSDC18 * BigInt(100)) / futureBvixValueUSD;
      
      console.log(`   Resulting CR: ${futureRatio.toString()}%`);
      break;
      
    } catch (error) {
      console.log(`❌ ${ethers.formatUnits(amount, 6)} USDC would fail: ${error.message.split('(')[0]}`);
    }
  }
  
  // Let's check if we can add some initial collateral using addCollateral function
  console.log("\n=== TRYING TO ADD INITIAL COLLATERAL ===");
  
  // Check if we can get some USDC for the deployer from the faucet
  console.log("Attempting to get USDC for deployer from faucet...");
  
  try {
    // Try to mint some USDC to deployer
    const mintAmount = ethers.parseUnits("5000", 6);
    const mintTx = await usdcContract.mint(deployer.address, mintAmount);
    await mintTx.wait();
    
    console.log("✅ Minted USDC to deployer");
    
    // Now add collateral
    const collateralAmount = ethers.parseUnits("1000", 6);
    
    const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, collateralAmount);
    await approveTx.wait();
    
    const addCollateralTx = await mintRedeem.addCollateral(collateralAmount);
    await addCollateralTx.wait();
    
    console.log("✅ Added 1000 USDC collateral to vault");
    
    // Now test user mint
    const userTestAmount = ethers.parseUnits("100", 6);
    const userResult = await mintRedeem.mint.staticCall(userTestAmount);
    console.log(`✅ User can now mint ${ethers.formatEther(userResult)} BVIX with 100 USDC`);
    
  } catch (error) {
    console.log("❌ Could not bootstrap vault:", error.message);
    console.log("This indicates the MockUSDC contract doesn't allow public minting");
  }
  
  console.log("\n=== ALTERNATIVE SOLUTION ===");
  console.log("Since we can't easily bootstrap the vault, let's modify the contract");
  console.log("to allow the first mint without collateral ratio checking");
}

main().catch(console.error);