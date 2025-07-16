// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintRedeem is Ownable {
    IERC20   public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee   = 30;  // 0.30 %
    uint256 public redeemFee = 30;  // 0.30 %

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

    // ---------- MINT ----------
    function mint(uint256 amount) external {
        require(amount > 0, "amount = 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        uint256 price     = oracle.getPrice();        // 18 dec
        uint256 fee       = (amount * mintFee) / 10_000;
        uint256 netAmount = amount - fee;

        // 6 → 18 decimals
        uint256 usdc18   = netAmount * 1e12;
        uint256 toMint   = (usdc18 * 1e18) / price;   // result 18 dec BVIX
        require(toMint > 0, "mint too small");

        bvix.mint(msg.sender, toMint);
    }

    // ---------- REDEEM ----------
    function redeem(uint256 bvixAmount) external {
        require(bvixAmount > 0, "amount = 0");

        // Burn caller’s BVIX (MintRedeem is owner, so allowed)
        bvix.burn(msg.sender, bvixAmount);

        // Calculate 6-dec USDC payout
        uint256 price18   = oracle.getPrice();                    // 18 dec
        uint256 usdc18    = (bvixAmount * price18) / 1e18;        // 18 dec
        uint256 usdc6     = usdc18 / 1e12;                        // 6 dec

        uint256 fee       = (usdc6 * redeemFee) / 10_000;
        uint256 netUSDC   = usdc6 - fee;

        require(
            usdc.transfer(msg.sender, netUSDC),
            "USDC transfer failed"
        );
    }
}

