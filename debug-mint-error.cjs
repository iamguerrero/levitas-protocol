const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEBUGGING MINT ERROR WITH PROPER ALLOWANCE ===");
  
  const V4_MINT_REDEEM = "0xDF0F4DaA003F05A985AB38434A4db7Ee7aC02859";
  const V4_BVIX = "0xE282c4ED583d0bd9cCd29c3d4130599ffe85E06B";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  // First, let's impersonate the user to test with proper allowance
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USER_ADDRESS],
  });
  
  const userSigner = await ethers.getSigner(USER_ADDRESS);
  
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeemV4 = await ethers.getContractAt("MintRedeemV4", V4_MINT_REDEEM);
  const bvixToken = await ethers.getContractAt("BVIXToken", V4_BVIX);
  
  // Check current state
  const userBalance = await usdcContract.balanceOf(USER_ADDRESS);
  const userAllowance = await usdcContract.allowance(USER_ADDRESS, V4_MINT_REDEEM);
  const bvixSupply = await bvixToken.totalSupply();
  
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  console.log("User allowance:", ethers.formatUnits(userAllowance, 6));
  console.log("BVIX total supply:", ethers.formatEther(bvixSupply));
  
  // Check ownership
  const bvixOwner = await bvixToken.owner();
  console.log("BVIX owner:", bvixOwner);
  console.log("Should be:", V4_MINT_REDEEM);
  
  if (bvixOwner !== V4_MINT_REDEEM) {
    console.log("❌ OWNERSHIP ISSUE!");
    return;
  }
  
  // Approve spending
  const testAmount = ethers.parseUnits("100", 6);
  
  if (userAllowance < testAmount) {
    console.log("Setting allowance...");
    const approveTx = await usdcContract.connect(userSigner).approve(V4_MINT_REDEEM, testAmount);
    await approveTx.wait();
    console.log("✅ Allowance set");
  }
  
  // Now test the mint
  console.log("\n=== TESTING MINT WITH PROPER ALLOWANCE ===");
  
  try {
    const result = await mintRedeemV4.connect(userSigner).mint.staticCall(testAmount);
    console.log("✅ MINT WORKS! Would mint:", ethers.formatEther(result), "BVIX");
    
    // Try actual mint
    console.log("Attempting actual mint...");
    const mintTx = await mintRedeemV4.connect(userSigner).mint(testAmount);
    await mintTx.wait();
    console.log("✅ ACTUAL MINT SUCCESSFUL!");
    
    // Check final state
    const finalUserBalance = await usdcContract.balanceOf(USER_ADDRESS);
    const finalBvixBalance = await bvixToken.balanceOf(USER_ADDRESS);
    const finalSupply = await bvixToken.totalSupply();
    
    console.log("Final user USDC balance:", ethers.formatUnits(finalUserBalance, 6));
    console.log("Final user BVIX balance:", ethers.formatEther(finalBvixBalance));
    console.log("Final BVIX total supply:", ethers.formatEther(finalSupply));
    
  } catch (error) {
    console.log("❌ Mint failed:", error.message);
    
    // Check specific error types
    if (error.message.includes("transfer amount exceeds allowance")) {
      console.log("Issue: Allowance not set correctly");
    } else if (error.message.includes("transfer amount exceeds balance")) {
      console.log("Issue: User balance insufficient");
    } else if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("Issue: Ownership problem");
    } else {
      console.log("Issue: Generic execution error");
      console.log("This suggests a problem with the contract logic");
    }
  }
  
  console.log("\n=== CONCLUSION ===");
  console.log("V4 Contract addresses:");
  console.log("BVIX_ADDRESS:", V4_BVIX);
  console.log("MINT_REDEEM_ADDRESS:", V4_MINT_REDEEM);
  console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
}

main().catch(console.error);