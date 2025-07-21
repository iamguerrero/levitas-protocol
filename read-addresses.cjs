const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Reading deployed contract addresses from Sepolia...");
  
  try {
    const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
    const [deployer] = await ethers.getSigners();
    
    console.log("Deployer:", deployer.address);
    
    // Get the latest transactions from the deployer
    const latestBlock = await provider.getBlockNumber();
    console.log("Latest block:", latestBlock);
    
    // Look for contract creation transactions in the last 100 blocks
    const addresses = {};
    let foundContracts = 0;
    
    for (let i = 0; i < 100; i++) {
      const blockNumber = latestBlock - i;
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.from && tx.from.toLowerCase() === deployer.address.toLowerCase()) {
              // Check if this is a contract creation transaction
              if (tx.to === null && tx.contractAddress) {
                console.log(`Found contract at block ${blockNumber}:`, tx.contractAddress);
                foundContracts++;
                
                // Try to determine what type of contract this is
                try {
                  const code = await provider.getCode(tx.contractAddress);
                  if (code !== "0x") {
                    // This is a deployed contract
                    console.log(`✅ Contract deployed at: ${tx.contractAddress}`);
                  }
                } catch (error) {
                  console.log(`❌ Error checking contract: ${error.message}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log(`Error reading block ${blockNumber}: ${error.message}`);
      }
    }
    
    console.log(`Found ${foundContracts} contract creation transactions`);
    
  } catch (error) {
    console.error("❌ Error reading addresses:", error.message);
  }
}

main()
  .then(() => {
    console.log("Address reading completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Address reading failed:", error);
    process.exit(1);
  }); 