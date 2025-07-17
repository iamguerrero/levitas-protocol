const { ethers } = require("hardhat");

async function main() {
  // Your actual MetaMask address from the screenshot
  const METAMASK_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  const NEW_MINT_REDEEM = "0x685FEc86F539a1C0e9aEEf02894D5D90bfC48098";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  
  console.log("=== TESTING MINT WITH METAMASK ADDRESS ===");
  console.log("MetaMask address:", METAMASK_ADDRESS);
  console.log("MintRedeemV2 address:", NEW_MINT_REDEEM);
  
  const provider = ethers.provider;
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  const mintRedeem = await ethers.getContractAt("MintRedeemV2", NEW_MINT_REDEEM);
  
  // Check balances
  const balance = await usdcContract.balanceOf(METAMASK_ADDRESS);
  const allowance = await usdcContract.allowance(METAMASK_ADDRESS, NEW_MINT_REDEEM);
  
  console.log("USDC balance:", ethers.formatUnits(balance, 6));
  console.log("Allowance:", ethers.formatUnits(allowance, 6));
  
  // Test with 100 USDC
  const mintAmount = ethers.parseUnits("100", 6);
  console.log("\nTesting mint with 100 USDC...");
  
  // Check current vault state
  const vaultBalance = await usdcContract.balanceOf(NEW_MINT_REDEEM);
  const bvixSupply = await mintRedeem.bvix().then(addr => 
    ethers.getContractAt("BVIXToken", addr)
  ).then(contract => contract.totalSupply());
  
  console.log("Vault USDC:", ethers.formatUnits(vaultBalance, 6));
  console.log("BVIX supply:", ethers.formatEther(bvixSupply));
  
  // Get current collateral ratio
  const currentCR = await mintRedeem.getCollateralRatio();
  console.log("Current CR:", currentCR.toString() + "%");
  
  // Test static call to see exact error
  try {
    const [signer] = await ethers.getSigners();
    
    // We need to impersonate the MetaMask address to test properly
    await ethers.provider.send("hardhat_impersonateAccount", [METAMASK_ADDRESS]);
    const impersonatedSigner = await ethers.getSigner(METAMASK_ADDRESS);
    
    // Connect contracts with impersonated signer
    const usdcWithSigner = usdcContract.connect(impersonatedSigner);
    const mintRedeemWithSigner = mintRedeem.connect(impersonatedSigner);
    
    console.log("\n=== TESTING WITH IMPERSONATED ACCOUNT ===");
    
    // Check if approval is needed
    const currentAllowance = await usdcWithSigner.allowance(METAMASK_ADDRESS, NEW_MINT_REDEEM);
    console.log("Current allowance:", ethers.formatUnits(currentAllowance, 6));
    
    if (currentAllowance < mintAmount) {
      console.log("Approving...");
      const approveTx = await usdcWithSigner.approve(NEW_MINT_REDEEM, mintAmount);
      await approveTx.wait();
      console.log("✅ Approved");
    }
    
    // Test mint
    console.log("Testing mint...");
    const result = await mintRedeemWithSigner.mint.staticCall(mintAmount);
    console.log("✅ MINT WOULD SUCCEED! Would mint:", ethers.formatEther(result), "BVIX");
    
    // Execute actual mint
    const mintTx = await mintRedeemWithSigner.mint(mintAmount);
    await mintTx.wait();
    console.log("✅ MINT SUCCESSFUL!");
    console.log("Transaction hash:", mintTx.hash);
    
  } catch (error) {
    console.log("❌ Mint failed:", error.message);
    
    // Parse the error to get more details
    if (error.message.includes("revert")) {
      console.log("\n=== REVERT REASON ANALYSIS ===");
      
      // Check specific revert reasons from the contract
      if (error.message.includes("Amount must be > 0")) {
        console.log("Error: Amount is zero or negative");
      } else if (error.message.includes("Mint amount too small")) {
        console.log("Error: Calculated BVIX amount is too small");
      } else if (error.message.includes("Collateral ratio too low")) {
        console.log("Error: Minting would violate collateral ratio");
      } else if (error.message.includes("ERC20: transfer amount exceeds balance")) {
        console.log("Error: Insufficient USDC balance");
      } else if (error.message.includes("ERC20: transfer amount exceeds allowance")) {
        console.log("Error: Insufficient allowance");
      } else {
        console.log("Unknown revert reason:", error.message);
      }
    }
  }
}

main().catch(console.error);