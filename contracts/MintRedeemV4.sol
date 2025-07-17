// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintRedeem V4 - Simplified Bootstrap Version
 * @notice Simplified version that works for both first mint and subsequent mints
 */
contract MintRedeemV4 is Ownable {
    IERC20   public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee = 30;  // 0.30%
    uint256 public redeemFee = 30;  // 0.30%
    uint256 public minCollateralRatio = 120; // 120% minimum

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted);
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

    /**
     * @notice Get current protocol collateral ratio
     */
    function getCollateralRatio() public view returns (uint256) {
        uint256 totalSupply = bvix.totalSupply();
        if (totalSupply == 0) return 0;
        
        uint256 vaultUSDC = usdc.balanceOf(address(this));
        uint256 price = oracle.getPrice();
        
        uint256 vaultUSDC18 = vaultUSDC * 1e12;
        uint256 bvixValueUSD = (totalSupply * price) / 1e18;
        
        if (bvixValueUSD == 0) return 0;
        return (vaultUSDC18 * 100) / bvixValueUSD;
    }

    /**
     * @notice Mint BVIX - simplified version
     */
    function mint(uint256 amount) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        
        // Calculate mint amount
        uint256 price = oracle.getPrice();
        uint256 netAmount = amount - ((amount * mintFee) / 10_000);
        uint256 bvixToMint = (netAmount * 1e30) / price;
        
        require(bvixToMint > 0, "Mint amount too small");
        
        // For first mint (when supply is 0), allow any amount
        uint256 currentSupply = bvix.totalSupply();
        if (currentSupply == 0) {
            // First mint - bootstrap the system
            require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
            bvix.mint(msg.sender, bvixToMint);
            emit Mint(msg.sender, amount, bvixToMint);
            return bvixToMint;
        }
        
        // For subsequent mints, check collateral ratio
        uint256 vaultBalance = usdc.balanceOf(address(this));
        uint256 futureVaultUSDC = vaultBalance + amount;
        uint256 futureSupply = currentSupply + bvixToMint;
        
        uint256 futureVaultUSDC18 = futureVaultUSDC * 1e12;
        uint256 futureBvixValueUSD = (futureSupply * price) / 1e18;
        
        uint256 futureRatio = (futureVaultUSDC18 * 100) / futureBvixValueUSD;
        
        require(futureRatio >= minCollateralRatio, "Would violate minimum collateral ratio");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        bvix.mint(msg.sender, bvixToMint);
        
        emit Mint(msg.sender, amount, bvixToMint);
        return bvixToMint;
    }

    /**
     * @notice Redeem BVIX for USDC
     */
    function redeem(uint256 bvixAmount) external {
        require(bvixAmount > 0, "Amount must be > 0");
        
        uint256 price = oracle.getPrice();
        uint256 usdc6 = (bvixAmount * price) / 1e30;
        uint256 netUSDC = usdc6 - ((usdc6 * redeemFee) / 10_000);
        
        bvix.burn(msg.sender, bvixAmount);
        require(usdc.transfer(msg.sender, netUSDC), "Transfer failed");
        
        emit Redeem(msg.sender, bvixAmount, netUSDC);
    }
}