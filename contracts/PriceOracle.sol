// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PriceOracle - Production-Grade Oracle for Volatility Indices
 * @notice Secure oracle with role-based access, TWAP buffer, and timelock
 * @dev BVIX pegged to Volmex BVIV Index, EVIX pegged to Volmex EVIV index
 */
contract PriceOracle is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public price;
    uint256 public lastUpdateTime;
    uint256 public updateDelay; // Timelock delay in seconds
    
    // TWAP buffer for price manipulation protection
    uint256 public constant TWAP_BUFFER = 3 minutes;
    uint256 public lastPriceUpdate;
    
    // Price bounds for safety
    uint256 public constant MIN_PRICE = 1e6;  // $1.00 (6 decimals)
    uint256 public constant MAX_PRICE = 1e12; // $1,000,000 (6 decimals)
    
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event UpdateDelayChanged(uint256 oldDelay, uint256 newDelay);
    event EmergencyPriceUpdate(uint256 newPrice, address updater);

    error PriceOutOfBounds();
    error UpdateTooFrequent();
    error TimelockNotExpired();
    error InvalidPrice();

    constructor(
        uint256 _initialPrice,
        uint256 _updateDelay,
        address _governor
    ) {
        if (_initialPrice < MIN_PRICE || _initialPrice > MAX_PRICE) {
            revert PriceOutOfBounds();
        }
        
        price = _initialPrice;
        lastUpdateTime = block.timestamp;
        lastPriceUpdate = block.timestamp;
        updateDelay = _updateDelay;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(PRICE_UPDATER_ROLE, _governor);
        _grantRole(PAUSER_ROLE, _governor);
        
        // Revoke admin role from deployer
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Update price with timelock protection
     * @param _newPrice New price in 6 decimals (e.g., 1000000 = $1.00)
     */
    function pushPrice(uint256 _newPrice) 
        external 
        onlyRole(PRICE_UPDATER_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        if (_newPrice < MIN_PRICE || _newPrice > MAX_PRICE) {
            revert PriceOutOfBounds();
        }
        
        if (block.timestamp < lastUpdateTime + updateDelay) {
            revert TimelockNotExpired();
        }
        
        if (block.timestamp < lastPriceUpdate + TWAP_BUFFER) {
            revert UpdateTooFrequent();
        }
        
        uint256 oldPrice = price;
        price = _newPrice;
        lastUpdateTime = block.timestamp;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(oldPrice, _newPrice, block.timestamp);
    }

    /**
     * @notice Emergency price update (bypasses timelock)
     * @param _newPrice New price in 6 decimals
     */
    function emergencyUpdatePrice(uint256 _newPrice) 
        external 
        onlyRole(GOVERNOR_ROLE) 
        nonReentrant 
    {
        if (_newPrice < MIN_PRICE || _newPrice > MAX_PRICE) {
            revert PriceOutOfBounds();
        }
        
        uint256 oldPrice = price;
        price = _newPrice;
        lastUpdateTime = block.timestamp;
        lastPriceUpdate = block.timestamp;
        
        emit EmergencyPriceUpdate(_newPrice, msg.sender);
    }

    /**
     * @notice Get current price
     * @return Current price in 6 decimals
     */
    function getPrice() external view returns (uint256) {
        return price;
    }

    /**
     * @notice Get price with staleness check
     * @return Current price and whether it's stale (>1 hour old)
     */
    function getPriceWithStaleness() external view returns (uint256, bool) {
        bool isStale = block.timestamp > lastUpdateTime + 1 hours;
        return (price, isStale);
    }

    /**
     * @notice Update the timelock delay
     * @param _newDelay New delay in seconds
     */
    function setUpdateDelay(uint256 _newDelay) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldDelay = updateDelay;
        updateDelay = _newDelay;
        emit UpdateDelayChanged(oldDelay, _newDelay);
    }

    /**
     * @notice Pause oracle operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause oracle operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Grant role to address
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.grantRole(role, account);
    }

    /**
     * @notice Revoke role from address
     * @param role Role to revoke
     * @param account Address to revoke role from
     */
    function revokeRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(GOVERNOR_ROLE) 
    {
        super.revokeRole(role, account);
    }

    /**
     * @notice Check if price update is allowed
     * @return True if update is allowed
     */
    function canUpdatePrice() external view returns (bool) {
        return block.timestamp >= lastUpdateTime + updateDelay && 
               block.timestamp >= lastPriceUpdate + TWAP_BUFFER;
    }

    /**
     * @notice Get time until next price update is allowed
     * @return Seconds until update is allowed
     */
    function timeUntilUpdateAllowed() external view returns (uint256) {
        uint256 timelockTime = lastUpdateTime + updateDelay;
        uint256 twapTime = lastPriceUpdate + TWAP_BUFFER;
        uint256 requiredTime = timelockTime > twapTime ? timelockTime : twapTime;
        
        if (block.timestamp >= requiredTime) {
            return 0;
        }
        return requiredTime - block.timestamp;
    }
} 