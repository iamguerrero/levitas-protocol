// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ChainlinkOracle - Chainlink Integration for Volatility Indices
 * @notice Wrapper around Chainlink price feeds with fallback mechanisms
 * @dev BVIX pegged to Volmex BVIV Index, EVIX pegged to Volmex EVIV index
 */
contract ChainlinkOracle is AccessControl, Pausable {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    AggregatorV3Interface public priceFeed;
    uint256 public fallbackPrice;
    uint256 public stalenessThreshold = 1 hours;
    bool public useFallback = false;
    
    event FallbackPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event StalenessThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event FallbackModeToggled(bool useFallback);

    error StalePrice();
    error InvalidPrice();
    error PriceFeedNotAvailable();

    constructor(
        address _priceFeed,
        uint256 _fallbackPrice,
        address _governor
    ) {
        if (_priceFeed != address(0)) {
            priceFeed = AggregatorV3Interface(_priceFeed);
        }
        
        fallbackPrice = _fallbackPrice;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(PAUSER_ROLE, _governor);
        
        // Revoke admin role from deployer
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Get current price from Chainlink or fallback
     * @return Current price in 6 decimals
     */
    function getPrice() external view returns (uint256) {
        if (useFallback || address(priceFeed) == address(0)) {
            return fallbackPrice;
        }
        
        try priceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            // Check for stale price
            if (block.timestamp - updatedAt > stalenessThreshold) {
                revert StalePrice();
            }
            
            // Check for invalid price
            if (price <= 0) {
                revert InvalidPrice();
            }
            
            // Convert Chainlink price (8 decimals) to 6 decimals
            return uint256(price) / 100;
            
        } catch {
            revert PriceFeedNotAvailable();
        }
    }

    /**
     * @notice Get price with staleness check
     * @return Current price and whether it's stale
     */
    function getPriceWithStaleness() external view returns (uint256, bool) {
        if (useFallback || address(priceFeed) == address(0)) {
            return (fallbackPrice, false);
        }
        
        try priceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            bool isStale = block.timestamp - updatedAt > stalenessThreshold;
            return (uint256(price) / 100, isStale);
            
        } catch {
            return (fallbackPrice, true);
        }
    }

    /**
     * @notice Update fallback price
     * @param _newPrice New fallback price in 6 decimals
     */
    function setFallbackPrice(uint256 _newPrice) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldPrice = fallbackPrice;
        fallbackPrice = _newPrice;
        emit FallbackPriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @notice Update staleness threshold
     * @param _newThreshold New threshold in seconds
     */
    function setStalenessThreshold(uint256 _newThreshold) external onlyRole(GOVERNOR_ROLE) {
        uint256 oldThreshold = stalenessThreshold;
        stalenessThreshold = _newThreshold;
        emit StalenessThresholdUpdated(oldThreshold, _newThreshold);
    }

    /**
     * @notice Toggle fallback mode
     * @param _useFallback Whether to use fallback price
     */
    function setFallbackMode(bool _useFallback) external onlyRole(GOVERNOR_ROLE) {
        useFallback = _useFallback;
        emit FallbackModeToggled(_useFallback);
    }

    /**
     * @notice Update price feed address
     * @param _newPriceFeed New Chainlink price feed address
     */
    function setPriceFeed(address _newPriceFeed) external onlyRole(GOVERNOR_ROLE) {
        priceFeed = AggregatorV3Interface(_newPriceFeed);
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
     * @notice Get Chainlink price feed metadata
     * @return decimals Number of decimals in the price feed
     * @return description Description of the price feed
     * @return version Version of the price feed
     */
    function getPriceFeedMetadata() external view returns (uint8, string memory, uint256) {
        if (address(priceFeed) == address(0)) {
            return (0, "No price feed", 0);
        }
        
        try priceFeed.decimals() returns (uint8 decimals) {
            try priceFeed.description() returns (string memory description) {
                try priceFeed.version() returns (uint256 version) {
                    return (decimals, description, version);
                } catch {
                    return (decimals, description, 0);
                }
            } catch {
                return (decimals, "Unknown", 0);
            }
        } catch {
            return (0, "Invalid price feed", 0);
        }
    }
} 