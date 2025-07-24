# Migration Guide: Base Sepolia → Polygon Amoy

This document outlines the complete migration of Levitas Finance from Base Sepolia to Polygon Amoy testnet.

## Migration Status

✅ **Core Configuration**
- Updated `hardhat.config.js` with Polygon Amoy network
- Created `client/src/lib/chains.ts` with network configurations
- Updated `web3.ts` and `web3-secure.ts` to use Polygon Amoy as primary network

✅ **Frontend Migration**
- Updated all wallet connection functions to use `switchToPolygonAmoy()`
- Changed faucet links to Polygon faucet
- Updated explorer links to use `amoy.polygonscan.com`
- Modified NetworkHelpers component for Polygon Amoy setup
- Updated trading interface to use new network constants

✅ **Backend Migration**
- Updated server vault routes to use Polygon Amoy RPC
- Created deployment script `scripts/deploy-amoy.js`

⏳ **Pending: Contract Deployment**
- Contracts need to be deployed to Polygon Amoy
- Need test MATIC for deployment gas fees
- Contract addresses need to be updated after deployment

## Pre-Deployment Requirements

1. **Get Test MATIC**
   ```bash
   # Visit https://faucet.polygon.technology/
   # Add your wallet address to get test MATIC
   ```

2. **Set Environment Variables**
   ```bash
   # Ensure .env has PRIVATE_KEY set
   PRIVATE_KEY=your_private_key_here
   ```

## Deployment Commands

```bash
# Deploy all contracts to Polygon Amoy
npx hardhat run scripts/deploy-amoy.js --network polygonAmoy

# Run tests on Polygon Amoy fork
npx hardhat test --network polygonAmoy
```

## Post-Deployment Updates Needed

After successful deployment, update the following files with new contract addresses:

1. `client/src/lib/web3.ts` - Update ADDRESSES for chain ID '80002'
2. `client/src/lib/web3-secure.ts` - Update SECURE_ADDRESSES for chain ID '80002'
3. `server/routes/vault.ts` - Update contract addresses
4. `README.md` - Update deployed contracts table

## Network Configuration

**Polygon Amoy Testnet:**
- Chain ID: 80002 (0x13882)
- RPC URL: https://rpc-amoy.polygon.technology/
- Explorer: https://amoy.polygonscan.com/
- Faucet: https://faucet.polygon.technology/
- Native Token: MATIC

## Key Changes Made

1. **Network Constants**: All Base Sepolia constants replaced with Polygon Amoy
2. **RPC URLs**: Updated to use Polygon Amoy RPC
3. **Explorer Links**: Changed from basescan.org to amoy.polygonscan.com
4. **Faucet Links**: Updated to Polygon faucet
5. **Gas Token**: Changed from ETH to MATIC

## Testing Checklist

After deployment and address updates:

- [ ] Frontend connects to Polygon Amoy
- [ ] MetaMask switches to correct network
- [ ] Faucet buttons work for MATIC and USDC
- [ ] Contract interactions work (mint/redeem)
- [ ] Vault stats API returns correct data
- [ ] Explorer links open correct transactions
- [ ] Real-time price updates function correctly

## Rollback Plan

If issues arise, the original Base Sepolia configuration is preserved in git history. The migration can be reverted by:

1. Reverting changes to web3 configuration files
2. Updating contract addresses back to Base Sepolia
3. Switching network constants back to Base

## Next Steps

1. **Get Test MATIC**: User needs to add test MATIC to deployment wallet
2. **Deploy Contracts**: Run deployment script
3. **Update Addresses**: Update all configuration files with new addresses
4. **Test Functionality**: Verify all features work on Polygon Amoy
5. **Update Documentation**: Finalize README with new addresses