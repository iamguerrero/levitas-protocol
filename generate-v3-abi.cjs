const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== GENERATING V3 ABI ===");
  
  // Get the contract factory to extract ABI
  const MintRedeemV3 = await ethers.getContractFactory("MintRedeemV3");
  const abi = MintRedeemV3.interface.fragments.map(fragment => fragment.format('json')).map(str => JSON.parse(str));
  
  // Write to ABI file
  const abiPath = "client/src/contracts/MintRedeemV3.abi.json";
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  
  console.log("✅ ABI generated at:", abiPath);
  
  // Test the first mint functionality
  console.log("\n=== TESTING V3 BOOTSTRAP MINT ===");
  
  const V3_ADDRESS = "0xdB78c7D165724428eC8F11713B17F067F9b51Dc3";
  const USER_ADDRESS = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  
  const mintRedeemV3 = await ethers.getContractAt("MintRedeemV3", V3_ADDRESS);
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check current vault state
  const vaultBalance = await usdcContract.balanceOf(V3_ADDRESS);
  const bvixSupply = await mintRedeemV3.bvix().then(addr => 
    ethers.getContractAt("BVIXToken", addr)
  ).then(contract => contract.totalSupply());
  
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6));
  console.log("BVIX total supply:", ethers.formatEther(bvixSupply));
  
  // Test first mint
  const testAmount = ethers.parseUnits("100", 6);
  
  try {
    const result = await mintRedeemV3.mint.staticCall(testAmount);
    console.log("✅ V3 BOOTSTRAP MINT WORKS!");
    console.log("Would mint:", ethers.formatEther(result), "BVIX");
    
    // Calculate initial collateral ratio
    const price = await mintRedeemV3.oracle().then(addr => 
      ethers.getContractAt("MockOracle", addr)
    ).then(oracle => oracle.getPrice());
    
    const futureVaultUSDC18 = testAmount * BigInt(1e12);
    const futureBvixValueUSD = (result * price) / BigInt(1e18);
    const futureRatio = (futureVaultUSDC18 * BigInt(100)) / futureBvixValueUSD;
    
    console.log("Initial collateral ratio:", futureRatio.toString() + "%");
    
    if (futureRatio >= 120n) {
      console.log("✅ Meets minimum collateral ratio requirement");
    }
    
  } catch (error) {
    console.log("❌ V3 bootstrap mint failed:", error.message);
    
    // Check if it's still a collateral ratio issue
    if (error.message.includes("Would violate minimum collateral ratio")) {
      console.log("The issue persists - let me check the contract logic");
      
      // Check supply more carefully
      const supply = await bvixSupply;
      console.log("Supply check:", ethers.formatEther(supply));
      
      if (supply > 0) {
        console.log("Supply is not zero - bootstrap condition not triggered");
      } else {
        console.log("Supply is zero - bootstrap should work");
      }
    }
  }
  
  console.log("\n=== V3 ADDRESSES FOR FRONTEND ===");
  console.log("BVIX_ADDRESS: 0x76c8c8ef73bA010579E47bD1372A55FBA7D55383");
  console.log("MINT_REDEEM_ADDRESS: 0xdB78c7D165724428eC8F11713B17F067F9b51Dc3");
}

main().catch(console.error);