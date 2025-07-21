const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking contract deployment status...");
  
  try {
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    
    // Test addresses from the deployment
    const testAddresses = {
      mockUsdc: "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297",
      bvix: "0x2E3bef50887aD2A30069c79D19Bb91085351C92a",
      evix: "0x7066700CAf442501B308fAe34d5919091e1b2380",
      oracle: "0x85485dD6cFaF5220150c413309C61a8EA24d24FE",
      evixOracle: "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F",
      mintRedeem: "0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117",
      evixMintRedeem: "0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf"
    };

    console.log("Testing contract addresses on Sepolia...");
    
    for (const [name, address] of Object.entries(testAddresses)) {
      console.log(`\nTesting ${name}: ${address}`);
      
      try {
        const code = await provider.getCode(address);
        if (code === "0x") {
          console.log(`❌ ${name}: No contract deployed`);
        } else {
          console.log(`✅ ${name}: Contract deployed (${code.length} bytes)`);
        }
      } catch (error) {
        console.log(`❌ ${name}: Error checking - ${error.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Check failed:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("Check completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Check failed:", error);
    process.exit(1);
  }); 