// SPDX-License-Identifier: MIT
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
