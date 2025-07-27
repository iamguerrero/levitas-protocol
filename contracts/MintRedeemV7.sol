// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintRedeemV7 - FIXED DECIMAL PRECISION
 * @notice Fixes the 1e30 decimal bug that caused massive token minting
 */
contract MintRedeemV7 is Ownable {
    IERC20   public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee = 30;    // 0.30%
    uint256 public redeemFee = 30;  // 0.30% 
    uint256 public minCollateralRatio = 120;
    uint256 public totalCollateral;
    uint256 public totalDebt;

    struct Position {
        uint256 collateral; // USDC amount (6 decimals)
        uint256 debt;       // Token amount (18 decimals)
    }

    mapping(address => Position) public positions;

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted, uint256 targetCR);
    event Redeem(address indexed user, uint256 bvixAmount, uint256 usdcRedeemed);

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

    function mintWithCollateralRatio(uint256 amount, uint256 targetCR) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(targetCR >= 120 && targetCR <= 300, "Invalid CR range");

        uint256 price = oracle.getPrice(); // 18 decimals
        uint256 fee = (amount * mintFee) / 10000;
        uint256 netAmount = amount - fee;
        
        // Calculate target debt value: netAmount / (targetCR/100)
        uint256 debtValue = (netAmount * 100) / targetCR;
        
        // CRITICAL FIX: Use 1e12 instead of 1e30 for proper decimal conversion
        // debtValue is in 6 decimals (USDC), price is 18 decimals, need 18 decimal tokens
        // Formula: (debtValue_6dec * 1e12) * 1e18 / price_18dec = tokens_18dec
        uint256 tokensToMint = (debtValue * 1e12 * 1e18) / price;

        require(tokensToMint > 0, "Amount too small");

        // Check global CR after mint
        uint256 futureCollateral = totalCollateral + netAmount;
        uint256 futureDebtValue = ((totalDebt + tokensToMint) * price) / 1e18 / 1e12;
        uint256 futureCR = (futureCollateral * 100) / futureDebtValue;
        require(futureCR >= minCollateralRatio, "Would violate min CR");

        // Update position and totals
        positions[msg.sender].collateral += netAmount;
        positions[msg.sender].debt += tokensToMint;
        totalCollateral += netAmount;
        totalDebt += tokensToMint;

        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        bvix.mint(msg.sender, tokensToMint);

        emit Mint(msg.sender, amount, tokensToMint, targetCR);
        return tokensToMint;
    }

    function redeem(uint256 amount) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        Position storage pos = positions[msg.sender];
        require(pos.debt >= amount, "Insufficient debt");

        uint256 price = oracle.getPrice();
        
        // CRITICAL FIX: Use 1e12 instead of 1e30 for proper decimal conversion
        uint256 debtValue = (amount * price) / (1e12 * 1e18);

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
        require(usdc.transfer(msg.sender, netRefund), "Transfer failed");

        emit Redeem(msg.sender, amount, netRefund);
        return netRefund;
    }

    function getCollateralRatio() public view returns (uint256) {
        if (totalDebt == 0) return 0;
        uint256 price = oracle.getPrice();
        uint256 debtValue = (totalDebt * price) / (1e18 * 1e12);  // Fixed decimal conversion
        return (totalCollateral * 100) / debtValue;
    }

    function getUserCollateralRatio(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return 0;
        uint256 price = oracle.getPrice();
        uint256 debtValue = (pos.debt * price) / (1e12 * 1e18);  // Fixed decimal conversion
        return (pos.collateral * 100) / debtValue;
    }
    
    // Emergency function to set fees
    function setFees(uint256 _mintFee, uint256 _redeemFee) external onlyOwner {
        require(_mintFee <= 500 && _redeemFee <= 500, "Max 5% fee");
        mintFee = _mintFee;
        redeemFee = _redeemFee;
    }
}