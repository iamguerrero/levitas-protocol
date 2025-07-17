const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing oracle price...");
  
  const [deployer] = await ethers.getSigners();
  
  const ORACLE_ADDRESS = "0x85485dD6cFaF5220150c413309C61a8EA24d24FE";
  
  try {
    // Connect to oracle
    const oracle = await ethers.getContractAt("MockOracle", ORACLE_ADDRESS);
    
    // Check current price
    const currentPrice = await oracle.getPrice();
    console.log("Current oracle price (raw):", currentPrice.toString());
    console.log("Current oracle price (8 decimals):", ethers.formatUnits(currentPrice, 8));
    
    // Set correct price: 84.5 USD with 8 decimals
    const correctPrice = ethers.parseUnits("84.5", 8); // 8450000000
    console.log("Setting price to:", correctPrice.toString(), "(84.5 USD)");
    
    const tx = await oracle.setPrice(correctPrice);
    await tx.wait();
    
    // Verify
    const newPrice = await oracle.getPrice();
    console.log("✅ New oracle price:", ethers.formatUnits(newPrice, 8), "USD");
    
    // Test CR calculation with correct price
    console.log("\n🧮 Testing CR calculation with correct price:");
    
    const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
    const BVIX_ADDRESS = '0xa60289981b67139fb7a9F3d31dD2D2BaA414A263';
    const MINT_REDEEM_ADDRESS = '0xa0133C6380bf9618e97Ab9a855aF2035e9498829';
    
    const provider = ethers.provider;
    const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function totalSupply() view returns (uint256)'];
    
    const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
    const bvix = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);
    
    const [vaultUSDC, totalBVIX] = await Promise.all([
      usdc.balanceOf(MINT_REDEEM_ADDRESS),
      bvix.totalSupply()
    ]);
    
    const usdcFloat = parseFloat(ethers.formatUnits(vaultUSDC, 6));
    const bvixFloat = parseFloat(ethers.formatEther(totalBVIX));
    const priceFloat = parseFloat(ethers.formatUnits(newPrice, 8));
    
    const totalBvixValue = bvixFloat * priceFloat;
    const correctCR = totalBvixValue > 0 ? (usdcFloat / totalBvixValue) * 100 : 0;
    
    console.log("USDC in vault:", usdcFloat);
    console.log("BVIX supply:", bvixFloat);
    console.log("BVIX price:", priceFloat);
    console.log("Total BVIX value:", totalBvixValue);
    console.log("Correct CR:", correctCR.toFixed(1) + "%");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);