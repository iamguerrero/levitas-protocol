const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEBUGGING COLLATERAL RATIO CALCULATION ===");
  
  const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
  const BVIX_ADDRESS = '0xcA7aC262190a3d126971281c496a521F5dD0f8D0';
  const MINT_REDEEM_ADDRESS = '0x9d12b251f8F6c432b1Ecd6ef722Bf45A8aFdE6A8';
  const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
  const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

  const ERC20_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
  ];

  const ORACLE_ABI = [
    'function getPrice() external view returns (uint256)',
  ];

  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
  
  const usdcContract = new ethers.Contract(ethers.getAddress(MOCK_USDC_ADDRESS), ERC20_ABI, provider);
  const bvixContract = new ethers.Contract(ethers.getAddress(BVIX_ADDRESS), ERC20_ABI, provider);
  const oracleContract = new ethers.Contract(ethers.getAddress(ORACLE_ADDRESS), ORACLE_ABI, provider);
  
  console.log("Fetching vault data...");
  const [vaultUsdcBalance, bvixTotalSupply, bvixPrice] = await Promise.all([
    usdcContract.balanceOf(ethers.getAddress(MINT_REDEEM_ADDRESS)),
    bvixContract.totalSupply(),
    oracleContract.getPrice()
  ]);
  
  console.log("Raw values:");
  console.log("Vault USDC balance (wei):", vaultUsdcBalance.toString());
  console.log("BVIX total supply (wei):", bvixTotalSupply.toString());
  console.log("BVIX price (wei):", bvixPrice.toString());
  
  const usdcValue = ethers.formatUnits(vaultUsdcBalance, 6);
  const bvixSupply = ethers.formatEther(bvixTotalSupply);
  const price = ethers.formatEther(bvixPrice);
  
  console.log("\nFormatted values:");
  console.log("USDC in vault:", usdcValue);
  console.log("BVIX supply:", bvixSupply);
  console.log("BVIX price:", price);
  
  // Current calculation from server
  const usdcFloat = parseFloat(usdcValue);
  const bvixFloat = parseFloat(bvixSupply);
  const priceFloat = parseFloat(price);
  
  const bvixValueInUsd = bvixFloat * priceFloat;
  const collateralRatio = bvixValueInUsd > 0 ? (usdcFloat / bvixValueInUsd) * 100 : 0;
  
  console.log("\nCurrent calculation:");
  console.log("BVIX value in USD:", bvixValueInUsd);
  console.log("Collateral ratio:", collateralRatio + "%");
  
  // What it should be based on your transactions:
  // You minted 1000 USDC of BVIX at 150% CR 
  // You minted 600 USDC of BVIX at 200% CR
  // Total USDC in: 1600
  // But vault shows 1199, meaning 401 USDC was used for fees or something
  
  console.log("\nExpected vs Actual:");
  console.log("Expected USDC after 1600 mint:", "~1600 minus fees");
  console.log("Actual USDC in vault:", usdcFloat);
  console.log("Expected CR should be around 150-200%");
  console.log("Actual CR:", collateralRatio + "%");
  
  if (collateralRatio < 110) {
    console.log("❌ CR is critically low!");
  } else if (collateralRatio < 150) {
    console.log("⚠️ CR is below desired level");
  } else {
    console.log("✅ CR is healthy");
  }
}

main().catch(console.error);