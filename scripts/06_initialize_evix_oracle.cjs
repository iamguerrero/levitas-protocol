const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Initializing EVIX Oracle with deployer:', deployer.address);

  // EVIX Oracle address
  const EVIX_ORACLE_ADDRESS = '0xCd7441A771a7F84E58d98E598B7Ff23A3688094F';
  
  // Oracle ABI
  const oracleABI = [
    'function getPrice() external view returns (int256)',
    'function updatePrice(int256 _newPrice) external',
    'function owner() external view returns (address)'
  ];

  const oracle = new ethers.Contract(EVIX_ORACLE_ADDRESS, oracleABI, deployer);
  
  // Check current price
  try {
    const currentPrice = await oracle.getPrice();
    console.log('Current EVIX price:', ethers.formatUnits(currentPrice, 8));
    
    // If price is 0, set initial price
    if (currentPrice === 0n) {
      console.log('Setting initial EVIX price to $37.98...');
      const initialPrice = ethers.parseUnits('37.98', 8); // $37.98 with 8 decimals
      
      const tx = await oracle.updatePrice(initialPrice);
      await tx.wait();
      
      console.log('EVIX Oracle initialized with price: $37.98');
      console.log('Transaction hash:', tx.hash);
    } else {
      console.log('EVIX Oracle already initialized with price:', ethers.formatUnits(currentPrice, 8));
    }
  } catch (error) {
    console.error('Error initializing EVIX Oracle:', error.message);
  }
}

main().catch(console.error);