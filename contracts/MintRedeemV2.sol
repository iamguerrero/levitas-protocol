// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BVIXToken.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintRedeem V2 - Protocol-Wide Collateral Enforcement
 * @notice Enforces minimum 120% collateral ratio for the entire protocol
 */
contract MintRedeemV2 is Ownable {
    IERC20   public usdc;
    BVIXToken public bvix;
    MockOracle public oracle;

    uint256 public mintFee = 30;  // 0.30%
    uint256 public redeemFee = 30;  // 0.30%
    uint256 public minCollateralRatio = 120; // 120% minimum

    event Mint(address indexed user, uint256 usdcAmount, uint256 bvixMinted);
    event Redeem(address indexed user, uint256 bvixAmount, uint256 usdcRedeemed);
    event CollateralRatioUpdated(uint256 newRatio);

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
     * @return ratio Current collateral ratio as percentage (e.g., 150 = 150%)
     */
    function getCollateralRatio() public view returns (uint256 ratio) {
        uint256 totalSupply = bvix.totalSupply();
        if (totalSupply == 0) return 0;
        
        uint256 vaultUSDC = usdc.balanceOf(address(this));
        uint256 price = oracle.getPrice(); // 18 decimals
        
        // Convert USDC (6 decimals) to 18 decimals
        uint256 vaultUSDC18 = vaultUSDC * 1e12;
        
        // Calculate total BVIX value in USD (18 decimals)
        uint256 bvixValueUSD = (totalSupply * price) / 1e18;
        
        if (bvixValueUSD == 0) return 0;
        
        // Return ratio as percentage
        return (vaultUSDC18 * 100) / bvixValueUSD;
    }

    /**
     * @notice Mint BVIX with collateral ratio enforcement
     * @param amount USDC amount to deposit (6 decimals)
     */
    function mint(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        uint256 price = oracle.getPrice();
        uint256 netAmount = amount - ((amount * mintFee) / 10_000);
        uint256 bvixToMint = (netAmount * 1e30) / price; // Combined 1e12 * 1e18
        
        require(bvixToMint > 0, "Mint amount too small");
        
        // Check future collateral ratio after mint
        uint256 vaultBalance = usdc.balanceOf(address(this));
        uint256 supply = bvix.totalSupply();
        
        // Calculate what collateral ratio would be after this mint
        uint256 futureVaultUSDC = vaultBalance + amount;
        uint256 futureSupply = supply + bvixToMint;
        
        // Convert to proper decimals for calculation
        uint256 futureVaultUSDC18 = futureVaultUSDC * 1e12;
        uint256 futureBvixValueUSD = (futureSupply * price) / 1e18;
        
        uint256 futureRatio = (futureVaultUSDC18 * 100) / futureBvixValueUSD;
        
        require(futureRatio >= minCollateralRatio, "Would violate minimum collateral ratio");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        bvix.mint(msg.sender, bvixToMint);
        
        emit Mint(msg.sender, amount, bvixToMint);
    }

    /**
     * @notice Redeem BVIX for USDC
     * @param bvixAmount Amount of BVIX to redeem (18 decimals)
     */
    function redeem(uint256 bvixAmount) external {
        require(bvixAmount > 0, "Amount must be > 0");
        
        uint256 price = oracle.getPrice();
        uint256 usdc6 = (bvixAmount * price) / 1e30; // Combined division by 1e18 * 1e12
        uint256 netUSDC = usdc6 - ((usdc6 * redeemFee) / 10_000);
        
        bvix.burn(msg.sender, bvixAmount);
        require(usdc.transfer(msg.sender, netUSDC), "Transfer failed");
        
        emit Redeem(msg.sender, bvixAmount, netUSDC);
    }

    /**
     * @notice Emergency function to add collateral
     * @param amount USDC amount to add
     */
    function addCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        emit CollateralRatioUpdated(getCollateralRatio());
    }

    /**
     * @notice Set minimum collateral ratio (owner only)
     * @param _minRatio New minimum ratio (e.g., 120 for 120%)
     */
    function setMinCollateralRatio(uint256 _minRatio) external onlyOwner {
        require(_minRatio >= 100, "Ratio must be >= 100%");
        minCollateralRatio = _minRatio;
    }
}