const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging CR calculation...");
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Contract addresses
  const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
  const BVIX_ADDRESS = '0xa60289981b67139fb7a9F3d31dD2D2BaA414A263';
  const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
  const MINT_REDEEM_ADDRESS = '0xa0133C6380bf9618e97Ab9a855aF2035e9498829';
  
  // ABIs
  const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function totalSupply() view returns (uint256)'];
  const ORACLE_ABI = ['function getPrice() view returns (int256)'];
  
  try {
    // Get contracts
    const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
    const bvix = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
    
    // Get values
    const vaultUSDC = await usdc.balanceOf(MINT_REDEEM_ADDRESS);
    const totalBVIX = await bvix.totalSupply();
    const price = await oracle.getPrice();
    
    console.log('📊 Vault Data:');
    console.log('USDC in vault:', ethers.formatUnits(vaultUSDC, 6), 'USDC');
    console.log('Total BVIX supply:', ethers.formatEther(totalBVIX), 'BVIX');
    console.log('BVIX price:', ethers.formatUnits(price, 8), 'USD');
    
    // Calculate CR manually
    const vaultUSDC18 = vaultUSDC * BigInt(10**12); // Convert 6 decimals to 18
    const bvixValueUSD = (totalBVIX * BigInt(price)) / BigInt(10**8); // Price has 8 decimals
    
    console.log('\\n🧮 CR Calculation:');
    console.log('USDC (18 decimals):', ethers.formatEther(vaultUSDC18));
    console.log('BVIX value (USD, 18 decimals):', ethers.formatEther(bvixValueUSD));
    
    if (bvixValueUSD > 0) {
      const cr = (vaultUSDC18 * BigInt(100)) / bvixValueUSD;
      console.log('Calculated CR:', cr.toString() + '%');
      console.log('CR as float:', parseFloat(ethers.formatEther(cr * BigInt(10**16))).toFixed(2) + '%');
    } else {
      console.log('No BVIX tokens, CR = 0%');
    }
    
    // What CR should be for 200% target
    const expectedBVIXFor200CR = vaultUSDC18 / BigInt(2); // 200% = 1/2 ratio
    console.log('\\n💡 Expected values for 200% CR:');
    console.log('Expected BVIX value:', ethers.formatEther(expectedBVIXFor200CR), 'USD');
    console.log('Expected BVIX tokens:', ethers.formatEther((expectedBVIXFor200CR * BigInt(10**8)) / BigInt(price)), 'BVIX');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);