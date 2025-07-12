// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintRedeem is Ownable {
    IERC20 public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee = 0; // In basis points (e.g., 30 = 0.3%)
    uint256 public redeemFee = 0;

    constructor(address _usdc, address _bvix, address _oracle) {
        usdc = IERC20(_usdc);
        bvix = BVIXToken(_bvix);
        oracle = MockOracle(_oracle);
    }

    function mint(uint256 usdcAmount) external {
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "Transfer failed");
        uint256 price = oracle.getPrice();
        uint256 tokensToMint = (usdcAmount * 1e18) / price;
        bvix.mint(msg.sender, tokensToMint);
    }

    function redeem(uint256 bvixAmount) external {
        bvix.burn(msg.sender, bvixAmount);
        uint256 price = oracle.getPrice();
        uint256 usdcToReturn = (bvixAmount * price) / 1e18;
        require(usdc.transfer(msg.sender, usdcToReturn), "Transfer failed");
    }
}
