const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging V5 contract ownership...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Contract addresses
  const BVIX_ADDRESS = "0xcA7aC262190a3d126971281c496a521F5dD0f8D0";
  const V5_MINT_REDEEM_ADDRESS = "0xFe9c81A98F33F15B279DE45ba022302113245D9F";
  
  // Check BVIX token ownership
  const BVIX = await ethers.getContractAt("BVIXToken", BVIX_ADDRESS);
  const bvixOwner = await BVIX.owner();
  console.log("BVIX owner:", bvixOwner);
  console.log("V5 MintRedeem address:", V5_MINT_REDEEM_ADDRESS);
  console.log("BVIX owned by V5?", bvixOwner.toLowerCase() === V5_MINT_REDEEM_ADDRESS.toLowerCase());
  
  // Check if V5 contract exists
  const provider = ethers.provider;
  const code = await provider.getCode(V5_MINT_REDEEM_ADDRESS);
  console.log("V5 contract deployed?", code !== "0x");
  
  if (code !== "0x") {
    try {
      const V5Contract = await ethers.getContractAt("MintRedeemV5Simple", V5_MINT_REDEEM_ADDRESS);
      const v5Owner = await V5Contract.owner();
      console.log("V5 contract owner:", v5Owner);
      console.log("V5 owned by deployer?", v5Owner.toLowerCase() === deployer.address.toLowerCase());
      
      // Check USDC and token addresses
      const usdcAddr = await V5Contract.usdc();
      const bvixAddr = await V5Contract.bvix();
      console.log("V5 USDC address:", usdcAddr);
      console.log("V5 BVIX address:", bvixAddr);
    } catch (error) {
      console.log("Error checking V5 contract:", error.message);
    }
  }
}

main().catch(console.error);