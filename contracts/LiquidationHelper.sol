// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Helper contract to facilitate liquidations in V6 contracts
// This contract acts as an intermediary to handle USDC transfers
contract LiquidationHelper {
    address public immutable usdc;
    address public immutable owner;
    
    event Liquidation(
        address indexed liquidator,
        address indexed vaultOwner,
        uint256 debtRepaid,
        uint256 collateralSeized,
        uint256 ownerRefund
    );
    
    constructor(address _usdc) {
        usdc = _usdc;
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // Facilitates liquidation by handling USDC transfers
    function facilitateLiquidation(
        address liquidator,
        address vaultOwner,
        uint256 liquidatorPayment,
        uint256 ownerRefund
    ) external onlyOwner {
        IERC20 usdcToken = IERC20(usdc);
        
        // Transfer USDC from this contract to liquidator (payment + bonus)
        require(usdcToken.transfer(liquidator, liquidatorPayment), "Transfer to liquidator failed");
        
        // Transfer remaining USDC to vault owner (refund)
        if (ownerRefund > 0) {
            require(usdcToken.transfer(vaultOwner, ownerRefund), "Transfer to owner failed");
        }
        
        emit Liquidation(liquidator, vaultOwner, 0, liquidatorPayment, ownerRefund);
    }
    
    // Allow owner to withdraw any stuck funds
    function withdrawStuckFunds(address token) external onlyOwner {
        IERC20(token).transfer(owner, IERC20(token).balanceOf(address(this)));
    }
}