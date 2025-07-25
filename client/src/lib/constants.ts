// Contract addresses for Base Sepolia
export const MOCK_USDC_ADDRESS = '0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297';
export const BVIX_ADDRESS = '0x93fd7d3BF951df6f5B0220ac92FA8D7E2322BA01';
export const EVIX_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf';

// V7 Contract addresses (current production)
export const MINT_REDEEM_ADDRESS = '0x65Bec0Ab96ab751Fd0b1D9c907342d9A61FB1117';
export const EVIX_MINT_REDEEM_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf';

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