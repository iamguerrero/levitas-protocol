const { ethers } = require("hardhat");

async function main() {
  console.log("=== TESTING V4 MINT WITH METAMASK USER ===");
  
  const V4_MINT_REDEEM = "0xDF0F4DaA003F05A985AB38434A4db7Ee7aC02859";
  const V4_BVIX = "0xE282c4ED583d0bd9cCd29c3d4130599ffe85E06B";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeemV4 = await ethers.getContractAt("MintRedeemV4", V4_MINT_REDEEM);
  const bvixToken = await ethers.getContractAt("BVIXToken", V4_BVIX);
  
  // Check current state
  const userBalance = await usdcContract.balanceOf(USER_ADDRESS);
  const userAllowance = await usdcContract.allowance(USER_ADDRESS, V4_MINT_REDEEM);
  const bvixSupply = await bvixToken.totalSupply();
  const vaultBalance = await usdcContract.balanceOf(V4_MINT_REDEEM);
  
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  console.log("User allowance:", ethers.formatUnits(userAllowance, 6));
  console.log("BVIX total supply:", ethers.formatEther(bvixSupply));
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  
  // Check ownership
  const bvixOwner = await bvixToken.owner();
  console.log("BVIX owner:", bvixOwner);
  console.log("Should be:", V4_MINT_REDEEM);
  
  if (bvixOwner !== V4_MINT_REDEEM) {
    console.log("❌ OWNERSHIP ISSUE!");
    return;
  }
  
  console.log("✅ Ownership is correct");
  
  // Test mint without allowance first to see the error
  console.log("\n=== TESTING MINT WITHOUT ALLOWANCE ===");
  const testAmount = ethers.parseUnits("100", 6);
  
  try {
    const result = await mintRedeemV4.mint.staticCall(testAmount);
    console.log("✅ MINT WORKS WITHOUT ALLOWANCE!");
    console.log("This should NOT happen - indicates an error");
  } catch (error) {
    console.log("❌ Expected error (no allowance):", error.message.split('(')[0]);
  }
  
  // Now test with a small amount to see if it's a precision issue
  console.log("\n=== TESTING DIFFERENT AMOUNTS ===");
  
  const testAmounts = [
    ethers.parseUnits("1", 6),     // 1 USDC
    ethers.parseUnits("10", 6),    // 10 USDC
    ethers.parseUnits("100", 6),   // 100 USDC
    ethers.parseUnits("1000", 6),  // 1000 USDC
  ];
  
  for (const amount of testAmounts) {
    try {
      const result = await mintRedeemV4.mint.staticCall(amount);
      console.log(`✅ ${ethers.formatUnits(amount, 6)} USDC works - mint ${ethers.formatEther(result)} BVIX`);
      break;
    } catch (error) {
      console.log(`❌ ${ethers.formatUnits(amount, 6)} USDC fails: ${error.message.split('(')[0]}`);
    }
  }
  
  console.log("\n=== FRONTEND READY ===");
  console.log("V4 contracts are deployed and ready for testing");
  console.log("User needs to:");
  console.log("1. Connect MetaMask wallet");
  console.log("2. Approve USDC spending");
  console.log("3. Mint BVIX tokens");
  console.log("");
  console.log("The authorization issue should be resolved with V4 contracts");
}

main().catch(console.error);