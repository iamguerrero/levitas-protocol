// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintRedeem V3 - Position-Aware Surplus-Refunding Vault
 * @notice ERC-4626 inspired vault with per-user position tracking for proper surplus refunding
 * @dev Each user has an individual position (CDP-style) for collateral and debt tracking
 */
contract MintRedeemV3 is Ownable {
    IERC20 public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee = 30; // 0.30%
    uint256 public redeemFee = 30; // 0.30%
    uint256 public minCollateralRatio = 120; // 120%

    struct Position {
        uint256 collateral; // USDC deposited (6 decimals)
        uint256 debt; // BVIX minted (18 decimals)
    }

    mapping(address => Position) public positions;

    event Mint(address indexed user, uint256 collateral, uint256 debt);
    event Redeem(address indexed user, uint256 debt, uint256 refunded);
    event PositionUpdated(address indexed user, uint256 newCollateral, uint256 newDebt);

    constructor(
        address _usdc,
        address _bvix,
        address _oracle,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        bvix = BVIXToken(_bvix);
        oracle = MockOracle(_oracle);
    }

    /**
     * @notice Get user's collateral ratio
     * @param user User address
     * @return ratio CR percentage (e.g. 150)
     */
    function getUserCollateralRatio(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return type(uint256).max;

        uint256 price = oracle.getPrice(); // 18 decimals
        uint256 debtValue = (pos.debt * price) / 1e18; // 18 decimals
        uint256 collateral18 = pos.collateral * 1e12; // 6 -> 18 decimals

        return (collateral18 * 100) / (debtValue / 1e12);
    }

    /**
     * @notice Mint BVIX by depositing collateral (ERC-4626 deposit style)
     * @param collateralAmount USDC to deposit
     * @param minDebtAmount Minimum BVIX to mint (slippage protection)
     * @return debtMinted BVIX minted
     */
    function deposit(uint256 collateralAmount, uint256 minDebtAmount) external returns (uint256 debtMinted) {
        require(collateralAmount > 0, "Amount must be > 0");
        
        uint256 price = oracle.getPrice();
        uint256 fee = (collateralAmount * mintFee) / 10000;
        uint256 netCollateral = collateralAmount - fee;

        // Calculate max mintable debt at min CR
        uint256 maxDebtValue = (netCollateral * 100) / minCollateralRatio; // 6 decimals
        uint256 maxDebt = (maxDebtValue * 1e30) / price; // to 18 decimals

        require(maxDebt >= minDebtAmount, "Slippage too high");

        // Update position
        positions[msg.sender].collateral += netCollateral;
        positions[msg.sender].debt += maxDebt;

        // Transfer and mint
        require(usdc.transferFrom(msg.sender, address(this), collateralAmount), "Transfer failed");
        bvix.mint(msg.sender, maxDebt);

        require(getUserCollateralRatio(msg.sender) >= minCollateralRatio, "CR too low");

        emit Mint(msg.sender, netCollateral, maxDebt);
        return maxDebt;
        }
        
    /**
     * @notice Redeem BVIX and get back collateral (ERC-4626 redeem style)
     * @param debtAmount BVIX to redeem
     * @param minRefund Minimum USDC to receive
     * @return refunded USDC refunded
     */
    function redeem(uint256 debtAmount, uint256 minRefund) external returns (uint256 refunded) {
        Position storage pos = positions[msg.sender];
        require(pos.debt >= debtAmount, "Insufficient debt");

        // Calculate proportional collateral refund
        uint256 collateralRefund = (debtAmount * pos.collateral) / pos.debt;
        uint256 fee = (collateralRefund * redeemFee) / 10000;
        refunded = collateralRefund - fee;

        require(refunded >= minRefund, "Slippage too high");

        // Update position
        pos.collateral -= collateralRefund;
        pos.debt -= debtAmount;

        // Burn and transfer
        bvix.burn(msg.sender, debtAmount);
        require(usdc.transfer(msg.sender, refunded), "Transfer failed");
        
        emit Redeem(msg.sender, debtAmount, refunded);
        return refunded;
    }

    // Additional ERC-4626 like functions
    function totalAssets() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function asset() external view returns (address) {
        return address(usdc);
    }
}