// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Mock USDC", "mUSDC") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000_000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Public faucet function for users to get test USDC
    function faucet() external {
        uint256 faucetAmount = 10000 * 10**decimals(); // 10,000 USDC
        _mint(msg.sender, faucetAmount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
