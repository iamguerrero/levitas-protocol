#!/bin/bash

# Create individual contract files for easier Basescan verification
# This avoids bytecode matching issues with multi-contract flattened files

echo "🔧 Creating individual contract files for verification..."

mkdir -p verification-ready

# Extract main contracts from flattened files
echo "📄 Extracting BVIXToken contract..."
sed -n '/^contract BVIXToken/,$p' flattened/BVIXToken.sol > verification-ready/BVIXToken-only.sol

echo "📄 Extracting MintRedeemV8 contract..."  
sed -n '/^contract MintRedeemV8/,$p' flattened/MintRedeemV8.sol > verification-ready/MintRedeemV8-only.sol

echo "📄 Extracting MockOracle contracts..."
cp flattened/BVIXOracle.sol verification-ready/BVIXOracle-only.sol
cp flattened/EVIXOracle.sol verification-ready/EVIXOracle-only.sol

echo "📄 Extracting EVIXToken contract..."
sed -n '/^contract EVIXToken/,$p' flattened/EVIXToken.sol > verification-ready/EVIXToken-only.sol

echo "📄 Extracting EVIXMintRedeemV6 contract..."
sed -n '/^contract EVIXMintRedeemV6/,$p' flattened/EVIXMintRedeemV6.sol > verification-ready/EVIXMintRedeemV6-only.sol

echo "✅ Individual contract files created in ./verification-ready/"
echo ""
echo "📋 Files ready for verification:"
echo "BVIXToken-only.sol       → 0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE"
echo "MintRedeemV8-only.sol    → 0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d"  
echo "BVIXOracle-only.sol      → 0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf"
echo "EVIXToken-only.sol       → 0x7066700CAf442501B308fAe34d5919091e1b2380"
echo "EVIXMintRedeemV6-only.sol → 0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf"
echo "EVIXOracle-only.sol      → 0xBd6E9809B9608eCAc3610cA65327735CC3c08104"
echo ""
echo "⚠️  Note: Individual contracts may have missing dependencies."
echo "💡 Recommendation: Use original flattened files with correct contract names from CONTRACT_VERIFICATION.md"