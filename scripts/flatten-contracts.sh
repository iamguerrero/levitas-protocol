#!/bin/bash

# Levitas Finance Contract Flattening Script
# This script creates flattened versions of all production contracts for Basescan verification

echo "🔨 Flattening Levitas Finance contracts for verification..."

# Create flattened directory
mkdir -p flattened

# BVIX V8 Contracts
echo "📄 Flattening BVIX V8 contracts..."
npx hardhat flatten contracts/BVIXToken.sol > flattened/BVIXToken.sol
npx hardhat flatten contracts/MintRedeemV8.sol > flattened/MintRedeemV8.sol
npx hardhat flatten contracts/MockOracle.sol > flattened/BVIXOracle.sol

# EVIX V6 Contracts  
echo "📄 Flattening EVIX V6 contracts..."
npx hardhat flatten contracts/EVIXToken.sol > flattened/EVIXToken.sol
npx hardhat flatten contracts/EVIXMintRedeemV6.sol > flattened/EVIXMintRedeemV6.sol
npx hardhat flatten contracts/MockOracle.sol > flattened/EVIXOracle.sol

echo "✅ All contracts flattened successfully!"
echo "📁 Flattened files saved in ./flattened/ directory"
echo ""
echo "📋 Production Contract Addresses:"
echo "BVIX Token V8:     0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE"
echo "BVIX MintRedeem V8: 0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d"  
echo "BVIX Oracle V8:    0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf"
echo "EVIX Token V6:     0x7066700CAf442501B308fAe34d5919091e1b2380"
echo "EVIX MintRedeem V6: 0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf"
echo "EVIX Oracle V6:    0xBd6E9809B9608eCAc3610cA65327735CC3c08104"
echo ""
echo "🔗 Next steps:"
echo "1. Visit https://sepolia.basescan.org/"
echo "2. Enter contract address and click 'Verify & Publish'"
echo "3. Use Solidity v0.8.21+commit.d9974bed with optimization enabled (200 runs)"
echo "4. Upload the corresponding flattened source file"
echo "5. Include proper constructor arguments (see CONTRACT_VERIFICATION.md)"