// Contract addresses for Base Sepolia
export const MOCK_USDC_ADDRESS = '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297';
export const BVIX_ADDRESS = '0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE'; // BVIX token V8 (WORKING - identical to EVIX)
export const EVIX_ADDRESS = '0x7066700CAf442501B308fAe34d5919091e1b2380'; // EVIX token V6

// CURRENT Contract addresses - V8 for BVIX, V6 for EVIX (both working perfectly)
export const MINT_REDEEM_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d'; // V8 BVIX (WORKING)
export const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // V6 EVIX

// V8 Contract addresses (WORKING - identical to EVIX V6 architecture)
export const BVIX_MINT_REDEEM_V8_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d';
export const BVIX_TOKEN_V8_ADDRESS = '0x7223A0Eb07B8d7d3CFbf84AC78eee4ae9DaA22CE';
export const BVIX_ORACLE_V8_ADDRESS = '0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf';
export const BVIX_VAULT_ADDRESS = '0x653A6a4dCe04dABAEdb521091A889bb1EE298D8d';

// Legacy V7 Contract addresses (BROKEN - ownership issues)
export const BVIX_MINT_REDEEM_V7_ADDRESS = '0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175'; // BROKEN
export const BVIX_TOKEN_V7_ADDRESS = '0xdcCCCC3A977cC0166788265eD4B683D41f3AED09'; // BROKEN

// Oracle addresses
export const BVIX_ORACLE_ADDRESS = '0xA6FAC514Fdc2C017FBCaeeDA27562dAC83Cf22cf'; // V8 WORKING
export const EVIX_ORACLE_ADDRESS = '0xBd6E9809B9608eCAc3610cA65327735CC3c08104';

// Network configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

// Fee configuration
export const MINT_FEE_BPS = 30; // 0.30%
export const REDEEM_FEE_BPS = 30; // 0.30%

// Collateral ratio thresholds
export const MIN_COLLATERAL_RATIO = 120;
export const LIQUIDATION_THRESHOLD = 120;
export const WARNING_THRESHOLD = 125;
export const OPTIMAL_COLLATERAL_RATIO = 150;

// Liquidation parameters
export const LIQUIDATION_BONUS = 5; // 5% bonus for liquidators
export const LIQUIDATION_GRACE_PERIOD = 3600; // 1 hour in seconds

// UI refresh intervals
export const PRICE_UPDATE_INTERVAL = 5000; // 5 seconds
export const POSITION_UPDATE_INTERVAL = 10000; // 10 seconds
export const LIQUIDATION_UPDATE_INTERVAL = 30000; // 30 seconds