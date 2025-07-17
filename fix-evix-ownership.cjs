const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Diagnosing EVIX ownership issue...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Contract addresses
  const EVIX_ADDRESS = "0x37e3b45fEF91D54Ef4992B71382EC36307908463";
  const NEW_EVIX_MINT_REDEEM = "0x0D1957BB292d2b9C19EA0Bbf50E6da8b5d175c3c";
  
  try {
    // Check EVIX token ownership
    const EVIX = await ethers.getContractAt("EVIXToken", EVIX_ADDRESS);
    const evixOwner = await EVIX.owner();
    console.log("Current EVIX owner:", evixOwner);
    console.log("New EVIX MintRedeem:", NEW_EVIX_MINT_REDEEM);
    console.log("EVIX owned by new contract?", evixOwner.toLowerCase() === NEW_EVIX_MINT_REDEEM.toLowerCase());
    
    if (evixOwner.toLowerCase() !== NEW_EVIX_MINT_REDEEM.toLowerCase()) {
      console.log("❌ EVIX not owned by new contract. Transferring ownership...");
      
      // Check if deployer can transfer
      const deployerCanTransfer = evixOwner.toLowerCase() === deployer.address.toLowerCase();
      console.log("Deployer can transfer?", deployerCanTransfer);
      
      if (deployerCanTransfer) {
        const tx = await EVIX.transferOwnership(NEW_EVIX_MINT_REDEEM);
        await tx.wait();
        console.log("✅ EVIX ownership transferred!");
        
        // Verify
        const newOwner = await EVIX.owner();
        console.log("New EVIX owner:", newOwner);
      } else {
        console.log("❌ Cannot transfer - deployer doesn't own EVIX token");
        
        // Check if current owner is old contract
        const OLD_CONTRACTS = [
          "0xe521441B80f6ddBe369e457b8D0F59b501f53333", // Old EVIX MintRedeem
          "0x30218E088a02ab32C28824F72DCe0Ef53C4E16F9"  // Previous V5
        ];
        
        for (const oldContract of OLD_CONTRACTS) {
          if (evixOwner.toLowerCase() === oldContract.toLowerCase()) {
            console.log(`EVIX owned by old contract: ${oldContract}`);
            try {
              const OldContract = await ethers.getContractAt("EVIXMintRedeemV5Simple", oldContract);
              const transferTx = await OldContract.transferEVIXOwnership(NEW_EVIX_MINT_REDEEM);
              await transferTx.wait();
              console.log("✅ Transferred via old contract!");
              break;
            } catch (error) {
              console.log(`Transfer via ${oldContract} failed:`, error.message);
            }
          }
        }
      }
    } else {
      console.log("✅ EVIX already owned by new contract!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);