# Smart Contract Verification Guide

This guide provides step-by-step instructions to verify Levitas Finance smart contracts on Base Sepolia Basescan.

## 📋 Contract Information

### Current Production Contracts

| Contract | Address | Version | Compiler |
|----------|---------|---------|----------|
| BVIX Token V8 | `0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE` | V8 | 0.8.19 |
| BVIX MintRedeem V8 | `0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d` | V8 | 0.8.19 |
| BVIX Oracle V8 | `0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf` | V8 | 0.8.19 |
| EVIX Token V6 | `0x7066700CAf442501B308fAe34d5919091e1b2380` | V6 | 0.8.19 |
| EVIX MintRedeem V6 | `0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf` | V6 | 0.8.19 |
| EVIX Oracle V6 | `0xBd6E9809B9608eCAc3610cA65327735CC3c08104` | V6 | 0.8.19 |

## 🔧 Verification Steps

### Step 1: Prepare Source Code

For each contract, you'll need the flattened source code. Use Hardhat to flatten:

```bash
# For BVIX contracts
npx hardhat flatten contracts/BVIXToken.sol > flattened/BVIXToken.sol
npx hardhat flatten contracts/MintRedeemV8.sol > flattened/MintRedeemV8.sol
npx hardhat flatten contracts/MockOracle.sol > flattened/MockOracle.sol

# For EVIX contracts  
npx hardhat flatten contracts/EVIXToken.sol > flattened/EVIXToken.sol
npx hardhat flatten contracts/EVIXMintRedeemV6.sol > flattened/EVIXMintRedeemV6.sol
```

### Step 2: Navigate to Basescan

1. Go to https://sepolia.basescan.org/
2. Enter the contract address in the search bar
3. Click on the contract address in results
4. Click the "Contract" tab
5. Click "Verify & Publish"

### Step 3: Compiler Settings

Use these exact settings for all contracts:

- **Compiler Type**: Solidity (Single file)
- **Compiler Version**: `v0.8.21+commit.d9974bed`
- **Open Source License Type**: MIT License
- **Optimization**: Enabled
- **Runs**: 200

### Step 4: Constructor Arguments (ABI-Encoded)

#### BVIX Token V8
```
Constructor: constructor(address initialOwner)
Arguments: ["0x<DEPLOYER_ADDRESS>"]
ABI-Encoded: 0x000000000000000000000000<DEPLOYER_ADDRESS_WITHOUT_0x>
```

#### BVIX MintRedeem V8
```
Constructor: constructor(address _usdc, address _bvix, address _oracle, address initialOwner)
Arguments: [
  "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297",  // Mock USDC
  "0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE",  // BVIX Token
  "0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf",  // BVIX Oracle  
  "0x<DEPLOYER_ADDRESS>"                           // Initial Owner
]
```

#### EVIX Token V6
```
Constructor: constructor(address initialOwner)
Arguments: ["0x<DEPLOYER_ADDRESS>"]
ABI-Encoded: 0x000000000000000000000000<DEPLOYER_ADDRESS_WITHOUT_0x>
```

#### EVIX MintRedeem V6
```
Constructor: constructor(address _usdc, address _evix, address _oracle, address initialOwner)
Arguments: [
  "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297",  // Mock USDC
  "0x7066700CAf442501B308fAe34d5919091e1b2380",  // EVIX Token
  "0xBd6E9809B9608eCAc3610cA65327735CC3c08104",  // EVIX Oracle
  "0x<DEPLOYER_ADDRESS>"                           // Initial Owner
]
```

#### Oracle Contracts
```
Constructor: constructor(address initialOwner)
Arguments: ["0x<DEPLOYER_ADDRESS>"]
ABI-Encoded: 0x000000000000000000000000<DEPLOYER_ADDRESS_WITHOUT_0x>
```

## 🛠️ Verification Tools

### Using ABI Encoder
You can use this online tool to encode constructor arguments:
https://abi.hashex.org/

### Using Hardhat Verify Plugin
Alternatively, use the Hardhat verify plugin:

```bash
# Install plugin
npm install --save-dev @nomiclabs/hardhat-etherscan

# Add to hardhat.config.js
module.exports = {
  etherscan: {
    apiKey: {
      baseSepolia: "YOUR_BASESCAN_API_KEY"
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};

# Verify contracts
npx hardhat verify --network baseSepolia 0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE "0x<DEPLOYER_ADDRESS>"
```

## ✅ Verification Checklist

- [ ] BVIX Token V8 - `0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE`
- [ ] BVIX MintRedeem V8 - `0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d`
- [ ] BVIX Oracle V8 - `0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf`
- [ ] EVIX Token V6 - `0x7066700CAf442501B308fAe34d5919091e1b2380`
- [ ] EVIX MintRedeem V6 - `0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf`
- [ ] EVIX Oracle V6 - `0xBd6E9809B9608eCAc3610cA65327735CC3c08104`

## 🚨 Common Issues

1. **Constructor Arguments**: Make sure to ABI-encode all constructor arguments
2. **Compiler Version**: Use exact version `v0.8.21+commit.d9974bed`
3. **Optimization**: Must match deployment settings (Enabled, 200 runs)
4. **License**: Use MIT License for all contracts
5. **Imports**: Ensure all imports are resolved in flattened files

## 📞 Support

If verification fails, check:
- Exact compiler version matches deployment
- Constructor arguments are properly ABI-encoded  
- Source code matches deployed bytecode
- All dependencies are included in flattened file

For additional help, refer to Basescan's verification documentation: https://docs.basescan.org/verifying-contracts