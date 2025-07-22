const fs = require('fs');
const path = require('path');

// Function to copy ABI from artifacts to client contracts
function copyABI(contractName, targetPath) {
  try {
    // Read from artifacts
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Write ABI to client contracts
    const clientPath = path.join(__dirname, '..', 'client', 'src', 'contracts', targetPath);
    fs.writeFileSync(clientPath, JSON.stringify(artifact.abi, null, 2));
    
    console.log(`✅ Generated ${targetPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${targetPath}:`, error.message);
  }
}

// Generate ABIs for secure contracts
console.log('🔧 Generating ABIs for secure contracts...');

// Create contracts directory if it doesn't exist
const contractsDir = path.join(__dirname, '..', 'client', 'src', 'contracts');
if (!fs.existsSync(contractsDir)) {
  fs.mkdirSync(contractsDir, { recursive: true });
}

// Copy ABIs
copyABI('PriceOracle', 'PriceOracle.abi.json');
copyABI('MintRedeemV7', 'MintRedeemV7.abi.json');
copyABI('BVIXToken', 'BVIXToken.abi.json');
copyABI('MockUSDC', 'MockUSDC.abi.json');

console.log('✅ ABI generation complete!'); 