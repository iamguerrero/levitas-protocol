// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./EVIXToken.sol";

// Oracle interface for price feeds
interface IOracle {
    function getPrice() external view returns (int256);
}

contract EVIXMintRedeem is Ownable {
    IERC20 public immutable usdc;
    EVIXToken public immutable evix;
    IOracle public oracle;
    
    // Fee in basis points (30 = 0.3%)
    uint256 public constant REDEEM_FEE_BPS = 30;
    uint256 public constant BASIS_POINTS = 10000;
    
    event Mint(address indexed user, uint256 usdcAmount, uint256 evixAmount);
    event Redeem(address indexed user, uint256 evixAmount, uint256 usdcAmount);
    
    constructor(
        address _usdc,
        address _evix,
        address _oracle,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        evix = EVIXToken(_evix);
        oracle = IOracle(_oracle);
    }
    
    function mint(uint256 usdcAmount) external {
        require(usdcAmount > 0, "amount = 0");
        
        // Get current EVIX price from oracle
        int256 price = oracle.getPrice();
        require(price > 0, "invalid price");
        
        // Calculate EVIX amount: usdcAmount / price
        // USDC has 6 decimals, EVIX has 18 decimals, price has 18 decimals
        uint256 evixAmount = (usdcAmount * 1e30) / uint256(price);
        
        // Transfer USDC from user to this contract
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");
        
        // Mint EVIX tokens to user
        evix.mint(msg.sender, evixAmount);
        
        emit Mint(msg.sender, usdcAmount, evixAmount);
    }
    
    function redeem(uint256 evixAmount) external {
        require(evixAmount > 0, "amount = 0");
        
        // Get current EVIX price from oracle
        int256 price = oracle.getPrice();
        require(price > 0, "invalid price");
        
        // Calculate USDC amount: evixAmount * price
        uint256 usdcAmount = (evixAmount * uint256(price)) / 1e30;
        
        // Apply redemption fee
        uint256 fee = (usdcAmount * REDEEM_FEE_BPS) / BASIS_POINTS;
        uint256 usdcAfterFee = usdcAmount - fee;
        
        // Burn EVIX tokens from user
        evix.burn(msg.sender, evixAmount);
        
        // Transfer USDC to user (after fee)
        require(usdc.transfer(msg.sender, usdcAfterFee), "USDC transfer failed");
        
        emit Redeem(msg.sender, evixAmount, usdcAfterFee);
    }
    
    function setOracle(address _oracle) external onlyOwner {
        oracle = IOracle(_oracle);
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "USDC transfer failed");
    }
}