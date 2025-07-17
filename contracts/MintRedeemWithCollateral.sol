// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintRedeem with Collateral Ratio Enforcement
 * @notice This contract enforces >120% collateral ratio for minting BVIX tokens
 */
contract MintRedeemWithCollateral is Ownable {
    IERC20   public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee   = 30;  // 0.30%
    uint256 public redeemFee = 30;  // 0.30%
    uint256 public minCollateralRatio = 120; // 120% minimum collateral ratio

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted, uint256 newCollateralRatio);
    event Redeem(address indexed user, uint256 bvixAmount, uint256 usdcRedeemed, uint256 newCollateralRatio);

    constructor(
        address _usdc,
        address _bvix,
        address _oracle,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc    = IERC20(_usdc);
        bvix    = BVIXToken(_bvix);
        oracle  = MockOracle(_oracle);
    }

    /**
     * @notice Calculate current collateral ratio
     * @return ratio Collateral ratio as percentage (e.g., 150 for 150%)
     */
    function getCollateralRatio() public view returns (uint256 ratio) {
        uint256 totalSupply = bvix.totalSupply();
        if (totalSupply == 0) return 0;
        
        uint256 vaultUSDC = usdc.balanceOf(address(this));
        uint256 price = oracle.getPrice(); // 18 decimals
        
        // Convert USDC (6 decimals) to 18 decimals for calculation
        uint256 vaultUSDC18 = vaultUSDC * 1e12;
        
        // Calculate total BVIX value in USD (18 decimals)
        uint256 bvixValueUSD = (totalSupply * price) / 1e18;
        
        if (bvixValueUSD == 0) return 0;
        
        // Calculate ratio as percentage
        ratio = (vaultUSDC18 * 100) / bvixValueUSD;
        return ratio;
    }

    /**
     * @notice Mint BVIX tokens with collateral ratio enforcement
     * @param amount USDC amount to deposit (6 decimals)
     */
    function mint(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        uint256 price = oracle.getPrice(); // 18 decimals
        uint256 fee = (amount * mintFee) / 10_000;
        uint256 netAmount = amount - fee;

        // Convert USDC (6 decimals) to 18 decimals
        uint256 usdc18 = netAmount * 1e12;
        
        // Calculate maximum BVIX that can be minted while maintaining >120% collateral
        uint256 currentVaultUSDC = usdc.balanceOf(address(this));
        uint256 currentSupply = bvix.totalSupply();
        
        // For new minting, we need to ensure:
        // (currentVaultUSDC * 1e12) / ((currentSupply + newBVIX) * price / 1e18) >= 1.20
        // Solving for newBVIX:
        // newBVIX <= (currentVaultUSDC * 1e12 * 1e18) / (price * 1.20) - currentSupply
        
        uint256 maxTotalBVIX = (currentVaultUSDC * 1e12 * 1e18 * 100) / (price * minCollateralRatio);
        require(maxTotalBVIX > currentSupply, "Cannot mint: would violate collateral ratio");
        
        uint256 maxNewBVIX = maxTotalBVIX - currentSupply;
        uint256 requestedBVIX = (usdc18 * 1e18) / price;
        
        uint256 toMint = requestedBVIX;
        if (requestedBVIX > maxNewBVIX) {
            toMint = maxNewBVIX;
        }
        
        require(toMint > 0, "Mint amount too small");

        bvix.mint(msg.sender, toMint);
        
        uint256 newRatio = getCollateralRatio();
        require(newRatio >= minCollateralRatio, "Collateral ratio too low after mint");
        
        emit Mint(msg.sender, amount, toMint, newRatio);
    }

    /**
     * @notice Redeem BVIX tokens for USDC
     * @param bvixAmount Amount of BVIX to redeem (18 decimals)
     */
    function redeem(uint256 bvixAmount) external {
        require(bvixAmount > 0, "Amount must be greater than 0");

        // Burn caller's BVIX
        bvix.burn(msg.sender, bvixAmount);

        // Calculate USDC payout
        uint256 price18 = oracle.getPrice(); // 18 decimals
        uint256 usdc18 = (bvixAmount * price18) / 1e18; // 18 decimals
        uint256 usdc6 = usdc18 / 1e12; // 6 decimals

        uint256 fee = (usdc6 * redeemFee) / 10_000;
        uint256 netUSDC = usdc6 - fee;

        require(
            usdc.transfer(msg.sender, netUSDC),
            "USDC transfer failed"
        );
        
        uint256 newRatio = getCollateralRatio();
        emit Redeem(msg.sender, bvixAmount, netUSDC, newRatio);
    }

    /**
     * @notice Set minimum collateral ratio (only owner)
     * @param _minRatio New minimum ratio as percentage (e.g., 120 for 120%)
     */
    function setMinCollateralRatio(uint256 _minRatio) external onlyOwner {
        require(_minRatio >= 100, "Ratio must be at least 100%");
        minCollateralRatio = _minRatio;
    }

    /**
     * @notice Emergency function to add USDC to improve collateral ratio
     */
    function addCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
    }
}