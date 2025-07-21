// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EVIXToken.sol";
import "./EVIXOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EVIXMintRedeemV6 is Ownable {
    IERC20 public usdc;
    EVIXToken public evix;
    EVIXOracle public oracle;

    uint256 public mintFee = 30;
    uint256 public redeemFee = 30;
    uint256 public minCollateralRatio = 120;

    struct Position {
        uint256 collateral;
        uint256 debt;
    }

    mapping(address => Position) public positions;
    uint256 public totalCollateral;
    uint256 public totalDebt;

    event Mint(address indexed user, uint256 usdcAmount, uint256 evixMinted, uint256 targetCR);
    event Redeem(address indexed user, uint256 evixAmount, uint256 usdcRedeemed);

    constructor(
        address _usdc,
        address _evix,
        address _oracle,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        evix = EVIXToken(_evix);
        oracle = EVIXOracle(_oracle);
    }

    function mintWithCollateralRatio(uint256 amount, uint256 targetCR) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(targetCR >= 120 && targetCR <= 300, "Invalid CR");

        uint256 price = uint256(oracle.getPrice());
        uint256 fee = (amount * mintFee) / 10000;
        uint256 netAmount = amount - fee;

        uint256 debtValue = (netAmount * 100) / targetCR;
        uint256 tokensToMint = (debtValue * 1e30) / price;

        require(tokensToMint > 0, "Amount too small");

        uint256 futureCollateral = totalCollateral + netAmount;
        uint256 futureDebtValue = ((totalDebt + tokensToMint) * price) / 1e18 / 1e12;
        uint256 futureCR = (futureCollateral * 100) / futureDebtValue;
        require(futureCR >= minCollateralRatio, "Would violate min CR");

        positions[msg.sender].collateral += netAmount;
        positions[msg.sender].debt += tokensToMint;
        totalCollateral += netAmount;
        totalDebt += tokensToMint;

        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        evix.mint(msg.sender, tokensToMint);

        emit Mint(msg.sender, amount, tokensToMint, targetCR);
        return tokensToMint;
    }

    function redeem(uint256 amount) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        Position storage pos = positions[msg.sender];
        require(pos.debt >= amount, "Insufficient debt");

        uint256 price = uint256(oracle.getPrice());
        uint256 debtValue = (amount * price) / 1e30;

        uint256 collateralRefund = (amount * pos.collateral) / pos.debt;
        uint256 fee = (collateralRefund * redeemFee) / 10000;
        uint256 netRefund = collateralRefund - fee;

        pos.collateral -= collateralRefund;
        pos.debt -= amount;
        totalCollateral -= collateralRefund;
        totalDebt -= amount;

        evix.burn(msg.sender, amount);
        require(usdc.transfer(msg.sender, netRefund), "Transfer failed");

        emit Redeem(msg.sender, amount, netRefund);
        return netRefund;
    }

    function getCollateralRatio() public view returns (uint256) {
        if (totalDebt == 0) return 0;
        uint256 price = uint256(oracle.getPrice());
        uint256 debtValue = (totalDebt * price) / 1e18 / 1e12;
        return (totalCollateral * 100) / debtValue;
    }

    function getUserCollateralRatio(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return 0;
        uint256 price = uint256(oracle.getPrice());
        uint256 debtValue = (pos.debt * price) / 1e30;
        return (pos.collateral * 100) / debtValue;
    }
} 