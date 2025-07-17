const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEPLOYING MINTREDEEM V3 WITH BOOTSTRAP SUPPORT ===");
  
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Deploy fresh BVIX token
  console.log("Deploying fresh BVIX token...");
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixToken = await BVIXToken.deploy(deployer.address);
  
  await bvixToken.waitForDeployment();
  const bvixAddress = await bvixToken.getAddress();
  console.log("✅ BVIX deployed at:", bvixAddress);
  
  // Deploy MintRedeemV3
  console.log("Deploying MintRedeemV3...");
  const MintRedeemV3 = await ethers.getContractFactory("MintRedeemV3");
  const mintRedeemV3 = await MintRedeemV3.deploy(
    MOCK_USDC_ADDRESS,
    bvixAddress,
    ORACLE_ADDRESS,
    deployer.address
  );
  
  await mintRedeemV3.waitForDeployment();
  const mintRedeemAddress = await mintRedeemV3.getAddress();
  console.log("✅ MintRedeemV3 deployed at:", mintRedeemAddress);
  
  // Transfer BVIX ownership to MintRedeemV3
  console.log("Transferring BVIX ownership...");
  const transferTx = await bvixToken.transferOwnership(mintRedeemAddress);
  await transferTx.wait();
  console.log("✅ Ownership transferred!");
  
  // Verify ownership
  const finalOwner = await bvixToken.owner();
  console.log("Final BVIX owner:", finalOwner);
  
  if (finalOwner === mintRedeemAddress) {
    console.log("🎉 SUCCESS! V3 contracts deployed with proper ownership");
    
    // Test mint with fresh vault
    console.log("\n=== TESTING FIRST MINT (BOOTSTRAP) ===");
    
    const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
    const testAmount = ethers.parseUnits("100", 6);
    
    try {
      const result = await mintRedeemV3.mint.staticCall(testAmount);
      console.log("✅ FIRST MINT WORKS!");
      console.log("Would mint:", ethers.formatEther(result), "BVIX");
      
      // Calculate the resulting collateral ratio
      const price = await mintRedeemV3.oracle().then(addr => 
        ethers.getContractAt("MockOracle", addr)
      ).then(oracle => oracle.getPrice());
      
      const futureVaultUSDC18 = testAmount * BigInt(1e12);
      const futureBvixValueUSD = (result * price) / BigInt(1e18);
      const futureRatio = (futureVaultUSDC18 * BigInt(100)) / futureBvixValueUSD;
      
      console.log("Initial collateral ratio:", futureRatio.toString() + "%");
      
      if (futureRatio >= 120n) {
        console.log("✅ Meets minimum collateral ratio requirement");
      } else {
        console.log("❌ Would not meet minimum collateral ratio");
      }
      
    } catch (error) {
      console.log("❌ First mint test failed:", error.message);
    }
    
    console.log("\n=== FINAL V3 ADDRESSES ===");
    console.log("BVIX_ADDRESS:", bvixAddress);
    console.log("MINT_REDEEM_ADDRESS:", mintRedeemAddress);
    console.log("MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
    console.log("ORACLE_ADDRESS:", ORACLE_ADDRESS);
    
    console.log("\n=== UPDATE FRONTEND ===");
    console.log("Update these addresses in client/src/lib/web3.ts:");
    console.log(`export const MINT_REDEEM_ADDRESS = "${mintRedeemAddress}";`);
    console.log(`export const BVIX_ADDRESS = "${bvixAddress}";`);
    
  } else {
    console.log("❌ Ownership transfer failed");
  }
}

main().catch(console.error);