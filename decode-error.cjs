const { ethers } = require("hardhat");

async function main() {
  console.log("=== DECODING ERROR MESSAGE ===");
  
  // The error data from the browser console
  const errorData = "0xfb8f41b2000000000000000000000000b507a6743787e1ee10365385f46dd5bfea10dcd500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f5e100";
  
  console.log("Error data:", errorData);
  
  // Try to decode this as a custom error
  // The first 4 bytes (0xfb8f41b2) are the error selector
  const errorSelector = errorData.slice(0, 10);
  console.log("Error selector:", errorSelector);
  
  // Let's check what errors our contract might throw
  const MintRedeemV4 = await ethers.getContractFactory("MintRedeemV4");
  const interface = MintRedeemV4.interface;
  
  // Get all errors from the interface
  const errors = interface.fragments.filter(f => f.type === 'error');
  console.log("Contract errors:", errors.map(e => e.name));
  
  // Try to decode with known errors
  for (const error of errors) {
    try {
      const decoded = interface.decodeErrorResult(error, errorData);
      console.log(`Decoded as ${error.name}:`, decoded);
    } catch (e) {
      // Not this error
    }
  }
  
  // Let's also check the BVIXToken errors
  const BVIXToken = await ethers.getContractFactory("BVIXToken");
  const bvixInterface = BVIXToken.interface;
  const bvixErrors = bvixInterface.fragments.filter(f => f.type === 'error');
  console.log("BVIX errors:", bvixErrors.map(e => e.name));
  
  for (const error of bvixErrors) {
    try {
      const decoded = bvixInterface.decodeErrorResult(error, errorData);
      console.log(`Decoded as ${error.name}:`, decoded);
    } catch (e) {
      // Not this error
    }
  }
  
  // The error data suggests it might be related to:
  // - 0xb507a6743787e1ee10365385f46dd5bfea10dcd5 (our MintRedeemV4 address)
  // - 0x0000000000000000000000000000000000000000 (zero address)
  // - 0x05f5e100 (100000000 in decimal, which is 100 USDC with 6 decimals)
  
  console.log("\n=== ANALYSIS ===");
  console.log("Address in error:", "0xb507a6743787e1ee10365385f46dd5bfea10dcd5");
  console.log("This is our MintRedeemV4 address");
  console.log("Zero address:", "0x0000000000000000000000000000000000000000");
  console.log("Amount:", parseInt("0x05f5e100", 16), "= 100 USDC (6 decimals)");
  
  // Let's try to figure out what's going wrong by testing the contract step by step
  console.log("\n=== STEP BY STEP DEBUGGING ===");
  
  const FINAL_MINT_REDEEM = "0xb507A6743787E1Ee10365385F46DD5BFEa10Dcd5";
  const FINAL_BVIX = "0x4Cd0c0ed02363F27fC2A8a3D7dC9aEA88ddCCf5E";
  const MOCK_USDC_ADDRESS = "0x79640e0f510a7c6d59737442649d9600C84b035f";
  
  const mintRedeemV4 = await ethers.getContractAt("MintRedeemV4", FINAL_MINT_REDEEM);
  const bvixToken = await ethers.getContractAt("BVIXToken", FINAL_BVIX);
  const usdcContract = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Check if the oracle is working
  try {
    const oracleAddress = await mintRedeemV4.oracle();
    console.log("Oracle address:", oracleAddress);
    
    const oracle = await ethers.getContractAt("MockOracle", oracleAddress);
    const price = await oracle.getPrice();
    console.log("Oracle price:", ethers.formatEther(price));
    
  } catch (error) {
    console.log("❌ Oracle error:", error.message);
  }
  
  // Check if BVIX token is working
  try {
    const totalSupply = await bvixToken.totalSupply();
    console.log("BVIX total supply:", ethers.formatEther(totalSupply));
    
    const owner = await bvixToken.owner();
    console.log("BVIX owner:", owner);
    
  } catch (error) {
    console.log("❌ BVIX token error:", error.message);
  }
  
  // The error selector 0xfb8f41b2 might be from OpenZeppelin's Ownable
  // Let's check if it's OwnableUnauthorizedAccount
  const ownableError = "0xfb8f41b2"; // This is often OwnableUnauthorizedAccount
  
  console.log("\n=== LIKELY ISSUE ===");
  console.log("This error pattern suggests the BVIX token mint function is failing");
  console.log("The error might be coming from the BVIX.mint() call inside MintRedeemV4");
  console.log("Even though ownership looks correct, there might be an issue with the mint call");
}

main().catch(console.error);