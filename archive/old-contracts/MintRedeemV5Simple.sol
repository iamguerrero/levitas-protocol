// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintRedeem V5 Simple - Proper Collateral Ratio Enforcement
 * @notice Simplified version with proper CR enforcement
 */
contract MintRedeemV5Simple is Ownable {
    IERC20   public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee = 30;  // 0.30%
    uint256 public minCollateralRatio = 120; // 120% minimum

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted, uint256 targetCR);

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
     * @notice Mint BVIX with collateral ratio enforcement
     * @param amount USDC amount to spend (full amount goes to vault)
     * @param targetCR Target collateral ratio (120-300)
     */
    function mintWithCollateralRatio(uint256 amount, uint256 targetCR) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(targetCR >= 120 && targetCR <= 300, "Invalid CR");
        
        // Calculate token value: amount / (targetCR/100)
        uint256 tokenValue = (amount * 100) / targetCR;
        uint256 netTokenValue = tokenValue - ((tokenValue * mintFee) / 10_000);
        
        uint256 price = oracle.getPrice();
        uint256 tokensToMint = (netTokenValue * 1e30) / price;
        
        require(tokensToMint > 0, "Amount too small");
        
        // Transfer USDC and mint tokens
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        bvix.mint(msg.sender, tokensToMint);
        
        emit Mint(msg.sender, amount, tokensToMint, targetCR);
        return tokensToMint;
    }

    /**
     * @notice Legacy mint function (defaults to 150% CR)
     */
    function mint(uint256 amount) external returns (uint256) {
        return this.mintWithCollateralRatio(amount, 150);
    }

    /**
     * @notice Redeem BVIX for USDC
     */
    function redeem(uint256 amount) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(bvix.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 price = oracle.getPrice();
        uint256 usdcValue = (amount * price) / 1e30;
        uint256 netUSDC = usdcValue - ((usdcValue * mintFee) / 10_000);
        
        require(usdc.balanceOf(address(this)) >= netUSDC, "Insufficient vault USDC");
        
        bvix.burn(msg.sender, amount);
        require(usdc.transfer(msg.sender, netUSDC), "Transfer failed");
        
        return netUSDC;
    }

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
}