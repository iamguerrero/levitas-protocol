// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BVIXToken.sol";
import "./PriceOracle.sol";

/**
 * @title MintRedeem V7 - Secure Position-Aware Vault with Access Control
 * @notice Production-ready vault with role-based access, reentrancy protection, and liquidation
 * @dev Integrates with secure PriceOracle for BVIX (Bitcoin Volatility Index)
 */
contract MintRedeemV7 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    IERC20 public immutable usdc;
    BVIXToken public immutable bvix;
    PriceOracle public immutable oracle;

    uint256 public mintFee = 30;  // 0.30%
    uint256 public redeemFee = 30;  // 0.30%
    uint256 public minCollateralRatio = 120;
    uint256 public liquidationThreshold = 120; // CR below which liquidation is possible
    uint256 public liquidationBonus = 5; // 5% bonus for liquidators

    struct Position {
        uint256 collateral;  // USDC deposited (6 decimals)
        uint256 debt;        // BVIX minted (18 decimals)
    }

    mapping(address => Position) public positions;
    uint256 public totalCollateral;
    uint256 public totalDebt;

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted, uint256 targetCR);
    event Redeem(address indexed user, uint256 bvixAmount, uint256 usdcRedeemed);
    event Liquidation(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);
    event FeesUpdated(uint256 oldMintFee, uint256 newMintFee, uint256 oldRedeemFee, uint256 newRedeemFee);
    event CollateralRatioUpdated(uint256 oldMinCR, uint256 newMinCR);
    event LiquidationParamsUpdated(uint256 oldThreshold, uint256 newThreshold, uint256 oldBonus, uint256 newBonus);

    error InsufficientCollateral();
    error InvalidCollateralRatio();
    error PositionNotFound();
    error LiquidationNotAllowed();
    error InvalidAmount();
    error TransferFailed();

    constructor(
        address _usdc,
        address _bvix,
        address _oracle,
        address _governor
    ) {
        usdc = IERC20(_usdc);
        bvix = BVIXToken(_bvix);
        oracle = PriceOracle(_oracle);
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(PAUSER_ROLE, _governor);
        _grantRole(LIQUIDATOR_ROLE, _governor);
        
        // Revoke admin role from deployer
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Mint BVIX tokens with USDC collateral
     * @param amount USDC amount to deposit (6 decimals)
     * @param targetCR Target collateral ratio (120-300)
     * @return tokensToMint Amount of BVIX minted
     */
    function mintWithCollateralRatio(uint256 amount, uint256 targetCR) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (amount == 0) revert InvalidAmount();
        if (targetCR < 120 || targetCR > 300) revert InvalidCollateralRatio();

        uint256 price = oracle.getPrice();
        uint256 fee = (amount * mintFee) / 10000;
        uint256 netAmount = amount - fee;

        // Calculate debt based on target CR
        uint256 debtValue = (netAmount * 100) / targetCR;
        uint256 tokensToMint = (debtValue * 1e30) / price;

        if (tokensToMint == 0) revert InvalidAmount();

        // Check global CR after mint
        uint256 futureCollateral = totalCollateral + netAmount;
        uint256 futureDebtValue = ((totalDebt + tokensToMint) * price) / 1e18 / 1e12;
        uint256 futureCR = (futureCollateral * 100) / futureDebtValue;
        if (futureCR < minCollateralRatio) revert InvalidCollateralRatio();

        // Update position and totals
        positions[msg.sender].collateral += netAmount;
        positions[msg.sender].debt += tokensToMint;
        totalCollateral += netAmount;
        totalDebt += tokensToMint;

        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        bvix.mint(msg.sender, tokensToMint);

        emit Mint(msg.sender, amount, tokensToMint, targetCR);
        return tokensToMint;
    }

    /**
     * @notice Redeem USDC by burning BVIX tokens
     * @param amount BVIX amount to burn (18 decimals)
     * @return netRefund USDC amount refunded
     */
    function redeem(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (amount == 0) revert InvalidAmount();
        
        Position storage pos = positions[msg.sender];
        if (pos.debt < amount) revert InsufficientCollateral();

        uint256 price = oracle.getPrice();
        uint256 debtValue = (amount * price) / 1e30;

        // Calculate proportional collateral refund (including surplus)
        uint256 collateralRefund = (amount * pos.collateral) / pos.debt;
        uint256 fee = (collateralRefund * redeemFee) / 10000;
        uint256 netRefund = collateralRefund - fee;

        // Update position and totals
        pos.collateral -= collateralRefund;
        pos.debt -= amount;
        totalCollateral -= collateralRefund;
        totalDebt -= amount;

        bvix.burn(msg.sender, amount);
        if (!usdc.transfer(msg.sender, netRefund)) revert TransferFailed();

        emit Redeem(msg.sender, amount, netRefund);
        return netRefund;
    }

    /**
     * @notice Liquidate an undercollateralized position
     * @param user Address of the user to liquidate
     */
    function liquidate(address user) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyRole(LIQUIDATOR_ROLE) 
    {
        Position storage pos = positions[user];
        if (pos.debt == 0) revert PositionNotFound();

        uint256 price = oracle.getPrice();
        uint256 debtValue = (pos.debt * price) / 1e30;
        uint256 userCR = (pos.collateral * 100) / debtValue;

        if (userCR >= liquidationThreshold) revert LiquidationNotAllowed();

        // Calculate liquidation amounts
        uint256 debtToRepay = pos.debt;
        uint256 collateralToSeize = (debtToRepay * pos.collateral) / pos.debt;
        uint256 bonus = (collateralToSeize * liquidationBonus) / 100;
        uint256 totalSeized = collateralToSeize + bonus;

        // Update position and totals
        pos.collateral = 0;
        pos.debt = 0;
        totalCollateral -= collateralToSeize;
        totalDebt -= debtToRepay;

        // Transfer tokens
        bvix.burn(user, debtToRepay);
        if (!usdc.transfer(msg.sender, totalSeized)) revert TransferFailed();

        emit Liquidation(user, msg.sender, debtToRepay, totalSeized);
    }

    /**
     * @notice Get global collateral ratio
     * @return Current collateral ratio
     */
    function getCollateralRatio() public view returns (uint256) {
        if (totalDebt == 0) return 0;
        uint256 price = oracle.getPrice();
        uint256 debtValue = (totalDebt * price) / 1e18 / 1e12;
        return (totalCollateral * 100) / debtValue;
    }

    /**
     * @notice Get user's collateral ratio
     * @param user User address
     * @return User's collateral ratio
     */
    function getUserCollateralRatio(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return 0;
        uint256 price = oracle.getPrice();
        uint256 debtValue = (pos.debt * price) / 1e30;
        return (pos.collateral * 100) / debtValue;
    }

    /**
     * @notice Get liquidation price for a user
     * @param user User address
     * @return Price at which user's position can be liquidated
     */
    function getLiquidationPrice(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return 0;
        return (pos.collateral * 100 * 1e30) / (pos.debt * liquidationThreshold);
    }

    // Admin functions

    /**
     * @notice Update mint and redeem fees
     * @param _mintFee New mint fee (basis points)
     * @param _redeemFee New redeem fee (basis points)
     */
    function setFees(uint256 _mintFee, uint256 _redeemFee) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldMintFee = mintFee;
        uint256 oldRedeemFee = redeemFee;
        mintFee = _mintFee;
        redeemFee = _redeemFee;
        emit FeesUpdated(oldMintFee, _mintFee, oldRedeemFee, _redeemFee);
    }

    /**
     * @notice Update minimum collateral ratio
     * @param _minCR New minimum collateral ratio
     */
    function setMinCollateralRatio(uint256 _minCR) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldMinCR = minCollateralRatio;
        minCollateralRatio = _minCR;
        emit CollateralRatioUpdated(oldMinCR, _minCR);
    }

    /**
     * @notice Update liquidation parameters
     * @param _threshold New liquidation threshold
     * @param _bonus New liquidation bonus
     */
    function setLiquidationParams(uint256 _threshold, uint256 _bonus) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldThreshold = liquidationThreshold;
        uint256 oldBonus = liquidationBonus;
        liquidationThreshold = _threshold;
        liquidationBonus = _bonus;
        emit LiquidationParamsUpdated(oldThreshold, _threshold, oldBonus, _bonus);
    }

    /**
     * @notice Pause all operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause all operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Emergency function to sweep tokens (governor only)
     * @param token Token to sweep
     * @param to Recipient address
     * @param amount Amount to sweep
     */
    function sweepTokens(address token, address to, uint256 amount) external onlyRole(GOVERNOR_ROLE) {
        IERC20(token).transfer(to, amount);
    }

    /**
     * @notice Grant role to address
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.grantRole(role, account);
    }

    /**
     * @notice Revoke role from address
     * @param role Role to revoke
     * @param account Address to revoke role from
     */
    function revokeRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.revokeRole(role, account);
    }
} 