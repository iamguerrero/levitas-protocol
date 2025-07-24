// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EVIXToken.sol";
import "./PriceOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EVIX MintRedeem Simple - Basic minting without complex logic
 */
contract EVIXMintRedeemSimple is Ownable {
    IERC20 public usdc;
    EVIXToken public evix;
    PriceOracle public oracle;

    uint256 public mintFee = 30;  // 0.30%

    event Mint(address indexed user, uint256 usdcAmount, uint256 evixMinted);
    event Redeem(address indexed user, uint256 evixAmount, uint256 usdcRedeemed);

    constructor(
        address _usdc,
        address _evix,
        address _oracle,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        evix = EVIXToken(_evix);
        oracle = PriceOracle(_oracle);
    }

    /**
     * @notice Simple mint function
     */
    function mint(uint256 usdcAmount) external returns (uint256) {
        require(usdcAmount > 0, "Amount must be > 0");
        
        // Get price from oracle
        uint256 price = uint256(oracle.getPrice());
        require(price > 0, "Invalid price");
        
        // Calculate fee
        uint256 fee = (usdcAmount * mintFee) / 10000;
        uint256 netAmount = usdcAmount - fee;
        
        // Calculate EVIX to mint: netAmount / price
        // USDC has 6 decimals, EVIX has 18 decimals, price has 6 decimals
        uint256 evixToMint = (netAmount * 1e18) / price;
        
        require(evixToMint > 0, "Amount too small");
        
        // Transfer USDC from user
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "Transfer failed");
        
        // Mint EVIX to user
        evix.mint(msg.sender, evixToMint);
        
        emit Mint(msg.sender, usdcAmount, evixToMint);
        return evixToMint;
    }

    /**
     * @notice Redeem EVIX for USDC
     */
    function redeem(uint256 evixAmount) external returns (uint256) {
        require(evixAmount > 0, "Amount must be > 0");
        require(evix.balanceOf(msg.sender) >= evixAmount, "Insufficient balance");
        
        // Get price from oracle
        uint256 price = uint256(oracle.getPrice());
        require(price > 0, "Invalid price");
        
        // Calculate USDC value: evixAmount * price
        uint256 usdcValue = (evixAmount * price) / 1e18;
        
        // Apply fee
        uint256 fee = (usdcValue * mintFee) / 10000;
        uint256 netUSDC = usdcValue - fee;
        
        require(usdc.balanceOf(address(this)) >= netUSDC, "Insufficient vault USDC");
        
        // Burn EVIX from user
        evix.burn(msg.sender, evixAmount);
        
        // Transfer USDC to user
        require(usdc.transfer(msg.sender, netUSDC), "Transfer failed");
        
        emit Redeem(msg.sender, evixAmount, netUSDC);
        return netUSDC;
    }

    /**
     * @notice Withdraw fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "Transfer failed");
    }
} 