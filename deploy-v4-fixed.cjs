const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEPLOYING V4 FIXED VERSION WITH RETURN VALUE ===");
  
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Deploy fresh BVIX token
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("✅ BVIX deployed at:", bvixAddress);
  
  // Deploy MintRedeemV4
  const MintRedeemV4 = await ethers.getContractFactory("MintRedeemV4");
  const mintRedeemV4 = await MintRedeemV4.deploy(
    MOCK_USDC_ADDRESS,
    bvixAddress,
    ORACLE_ADDRESS,
    deployer.address
  );
  await mintRedeemV4.waitForDeployment();
  const mintRedeemAddress = await mintRedeemV4.getAddress();
  console.log("✅ MintRedeemV4 deployed at:", mintRedeemAddress);
  
  // Transfer ownership
  const transferTx = await bvixToken.transferOwnership(mintRedeemAddress);
  await transferTx.wait();
  console.log("✅ Ownership transferred!");
  
  // Verify ownership
  const finalOwner = await bvixToken.owner();
  console.log("Final BVIX owner:", finalOwner);
  
  if (finalOwner === mintRedeemAddress) {
    console.log("🎉 SUCCESS! V4 Fixed contracts deployed");
    
    // Test first mint
    const testAmount = ethers.parseUnits("100", 6);
    
    try {
      const result = await mintRedeemV4.mint.staticCall(testAmount);
      console.log("✅ V4 FIXED MINT WORKS!");
      console.log("Would mint:", ethers.formatEther(result), "BVIX");
      
      // Calculate resulting collateral ratio
      const price = await mintRedeemV4.oracle().then(addr => 
        ethers.getContractAt("MockOracle", addr)
      ).then(oracle => oracle.getPrice());
      
      const futureVaultUSDC18 = testAmount * BigInt(1e12);
      const futureBvixValueUSD = (result * price) / BigInt(1e18);
      const futureRatio = (futureVaultUSDC18 * BigInt(100)) / futureBvixValueUSD;
      
      console.log("Initial collateral ratio:", futureRatio.toString() + "%");
      
      if (futureRatio >= 120n) {
        console.log("✅ Meets minimum collateral ratio");
      }
      
    } catch (error) {
      console.log("❌ V4 fixed mint failed:", error.message);
    }
    
    console.log("\n=== V4 FIXED FINAL ADDRESSES ===");
    console.log("BVIX_ADDRESS:", bvixAddress);
    console.log("MINT_REDEEM_ADDRESS:", mintRedeemAddress);
    console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
    console.log("ORACLE_ADDRESS:", ORACLE_ADDRESS);
    
    console.log("\n=== UPDATE THESE IN FRONTEND ===");
    console.log(`export const MINT_REDEEM_ADDRESS = "${mintRedeemAddress}";`);
    console.log(`export const BVIX_ADDRESS = "${bvixAddress}";`);
    
  } else {
    console.log("❌ Ownership issue");
  }
}

main().catch(console.error);