const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging CR math problem...");
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Contract addresses
  const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
  const BVIX_ADDRESS = '0xa60289981b67139fb7a9F3d31dD2D2BaA414A263';
  const ORACLE_ADDRESS = '0x85485dD6cFaF5220150c413309C61a8EA24d24FE';
  const MINT_REDEEM_ADDRESS = '0xa0133C6380bf9618e97Ab9a855aF2035e9498829';
  
  const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function totalSupply() view returns (uint256)'];
  const ORACLE_ABI = ['function getPrice() view returns (int256)'];
  
  try {
    const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
    const bvix = new ethers.Contract(BVIX_ADDRESS, ERC20_ABI, provider);
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
    
    // Get raw values
    const vaultUSDC = await usdc.balanceOf(MINT_REDEEM_ADDRESS);
    const totalBVIX = await bvix.totalSupply();
    const price = await oracle.getPrice();
    
    console.log('📊 Raw Contract Values:');
    console.log('USDC in vault (raw):', vaultUSDC.toString());
    console.log('USDC in vault (formatted):', ethers.formatUnits(vaultUSDC, 6), 'USDC');
    console.log('Total BVIX (raw):', totalBVIX.toString());
    console.log('Total BVIX (formatted):', ethers.formatEther(totalBVIX), 'BVIX');
    console.log('BVIX price (raw):', price.toString());
    console.log('BVIX price (formatted):', ethers.formatUnits(price, 8), 'USD');
    
    // Manual CR calculation - step by step
    console.log('\\n🧮 Step-by-step CR calculation:');
    
    // Step 1: Convert USDC to 18 decimals
    const vaultUSDC18 = vaultUSDC * BigInt(10**12);
    console.log('1. USDC converted to 18 decimals:', vaultUSDC18.toString());
    console.log('   As float:', ethers.formatEther(vaultUSDC18));
    
    // Step 2: Calculate BVIX value in USD (18 decimals)
    const bvixValueUSD = (totalBVIX * price) / BigInt(10**8);
    console.log('2. BVIX value in USD (18 decimals):', bvixValueUSD.toString());
    console.log('   As float:', ethers.formatEther(bvixValueUSD));
    
    // Step 3: Calculate CR
    if (bvixValueUSD > 0) {
      const crRaw = (vaultUSDC18 * BigInt(100)) / bvixValueUSD;
      console.log('3. CR calculation raw:', crRaw.toString());
      console.log('   CR as percentage:', crRaw.toString() + '%');
      
      // Try different formatting approaches
      const crFloat1 = Number(crRaw);
      const crFloat2 = parseFloat(ethers.formatEther(crRaw * BigInt(10**16)));
      
      console.log('\\n📈 Different CR formatting attempts:');
      console.log('Method 1 (Number):', crFloat1);
      console.log('Method 2 (formatEther):', crFloat2);
    }
    
    // Expected values for 200% CR
    console.log('\\n💡 Expected for 200% CR:');
    console.log('If user minted 2000 USDC at 200% CR:');
    console.log('- Should have spent: 2000 USDC');
    console.log('- Should have received: 1000 USD worth of tokens');
    console.log('- BVIX price:', ethers.formatUnits(price, 8), 'USD');
    console.log('- Expected BVIX tokens:', ethers.formatEther((BigInt(1000) * BigInt(10**26)) / price));
    console.log('- Expected CR: 200%');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);