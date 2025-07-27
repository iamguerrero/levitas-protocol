// Contract addresses for Base Sepolia
export const MOCK_USDC_ADDRESS = '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297';
export const BVIX_ADDRESS = '0xdcCCCC3A977cC0166788265eD4B683D41f3AED09'; // BVIX token V7 (FIXED DECIMALS)
export const EVIX_ADDRESS = '0x7066700CAf442501B308fAe34d5919091e1b2380'; // EVIX token V6

// CURRENT Contract addresses - V7 for BVIX, V6 for EVIX
export const MINT_REDEEM_ADDRESS = '0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175'; // V7 BVIX (FIXED)
export const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf'; // V6 EVIX

// V7 Contract addresses (FIXED decimal precision - current production for BVIX)
export const BVIX_MINT_REDEEM_V7_ADDRESS = '0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175';
export const BVIX_TOKEN_V7_ADDRESS = '0xdcCCCC3A977cC0166788265eD4B683D41f3AED09';
export const BVIX_VAULT_ADDRESS = '0x4c271CffdBf8DcdC21D4Cb80feEc425E00309175';

// V8 Contract addresses (with advanced liquidation features)
export const MINT_REDEEM_V8_ADDRESS = '0x0000000000000000000000000000000000000000'; // To be deployed
export const EVIX_MINT_REDEEM_V8_ADDRESS = '0x0000000000000000000000000000000000000000'; // To be deployed

// Oracle addresses
export const BVIX_ORACLE_ADDRESS = '0x40F86ad53E5379C76de37A37d4cEC8Fb93949B51';
export const EVIX_ORACLE_ADDRESS = '0xd95f0FFB93d7cb1e8E19BD0F93d8be37d1419Eb0';

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