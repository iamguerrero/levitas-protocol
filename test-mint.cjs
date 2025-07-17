const { ethers } = require("hardhat");

async function main() {
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  
  const [user] = await ethers.getSigners();
  console.log("Testing mint for user:", user.address);

  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  
  // Check user balance
  const userBalance = await usdcContract.balanceOf(user.address);
  const mintAmount = ethers.parseUnits("100", 6);
  
  console.log("User USDC balance:", ethers.formatUnits(userBalance, 6));
  console.log("Trying to mint with:", ethers.formatUnits(mintAmount, 6));
  
  if (userBalance < mintAmount) {
    console.log("❌ User doesn't have enough USDC!");
    console.log("Need to get test USDC first...");
    
    // Try to get test USDC
    try {
      const mintTx = await usdcContract.mint(user.address, ethers.parseUnits("1000", 6));
      await mintTx.wait();
      console.log("✅ Got 1000 test USDC");
      
      const newBalance = await usdcContract.balanceOf(user.address);
      console.log("New balance:", ethers.formatUnits(newBalance, 6));
    } catch (error) {
      console.log("❌ Failed to get test USDC:", error.message);
      console.log("The user needs to get USDC from a faucet or other source");
      return;
    }
  }
  
  // Try to mint
  try {
    // First approve
    console.log("Approving USDC...");
    const approveTx = await usdcContract.approve(NEW_MINT_REDEEM, mintAmount);
    await approveTx.wait();
    console.log("✅ Approved");
    
    // Then mint
    console.log("Minting...");
    const mintTx = await mintRedeem.mint(mintAmount);
    await mintTx.wait();
    console.log("✅ Mint successful!");
    
  } catch (error) {
    console.log("❌ Mint failed:", error.message);
    
    // Try to get more detailed error
    try {
      await mintRedeem.mint.staticCall(mintAmount);
    } catch (staticError) {
      console.log("Static call error:", staticError.message);
    }
  }
}

main().catch(console.error);