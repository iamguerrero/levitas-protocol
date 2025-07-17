// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EVIXOracle is Ownable {
    int256 private price;
    uint256 private lastUpdated;
    
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    
    constructor(int256 _initialPrice, address initialOwner) Ownable(initialOwner) {
        price = _initialPrice;
        lastUpdated = block.timestamp;
        emit PriceUpdated(_initialPrice, block.timestamp);
    }
    
    function getPrice() external view returns (int256) {
        return price;
    }
    
    function getLastUpdated() external view returns (uint256) {
        return lastUpdated;
    }
    
    function updatePrice(int256 _newPrice) external onlyOwner {
        price = _newPrice;
        lastUpdated = block.timestamp;
        emit PriceUpdated(_newPrice, block.timestamp);
    }
}