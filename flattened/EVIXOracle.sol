[dotenv@17.2.0] injecting env (0) from .env (tip: ⚙️  override existing env vars with { override: true })
// Sources flattened with hardhat v2.26.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/MockOracle.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.21;

contract MockOracle {
    uint256 public price;

    constructor(uint256 _initialPrice) {
        price = _initialPrice;
    }

    function updatePrice(uint256 _newPrice) external {
        price = _newPrice;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
