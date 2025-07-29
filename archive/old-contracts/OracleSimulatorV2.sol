// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IOracle {
    function updatePrice(uint256 _newPrice) external;
    function getPrice() external view returns (uint256);
}

interface IEVIXOracle {
    function updatePrice(int256 _newPrice) external;
    function getPrice() external view returns (int256);
}

/**
 * @title OracleSimulatorV2
 * @notice Fixed version that handles actual oracle decimal formats
 * @dev BVIX uses ~10-11 decimals, EVIX uses ~10-11 decimals
 */
contract OracleSimulatorV2 is Ownable {
    // Oracle contracts
    IOracle public bvixOracle;
    IEVIXOracle public evixOracle;
    
    // Price bounds (using actual decimal format - approximately 10^10-10^11 scale)
    uint256 public constant BVIX_MIN_PRICE = 15e10;   // $15.00 
    uint256 public constant BVIX_MAX_PRICE = 150e10;  // $150.00 
    uint256 public constant EVIX_MIN_PRICE = 20e10;   // $20.00 
    uint256 public constant EVIX_MAX_PRICE = 180e10;  // $180.00 
    
    // Mean reversion targets (using actual decimal format)
    uint256 public bvixMeanPrice = 42e10;  // $42.00 target
    uint256 public evixMeanPrice = 38e10;  // $38.00 target
    
    // Circuit breaker: max 1% movement per minute
    uint256 public constant MAX_MOVEMENT_BPS = 100; // 1.00% in basis points
    
    // Volatility parameters (in basis points)
    uint256 public bvixVolatility = 50;  // 0.5% base volatility
    uint256 public evixVolatility = 60;  // 0.6% base volatility
    uint256 public meanReversionStrength = 20; // 0.2% pull toward mean
    
    // Simulation state
    uint256 public lastUpdateTime;
    bool public simulationActive;
    
    // Random seed for price generation
    uint256 private nonce;
    
    event PriceUpdated(string indexed token, uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event SimulationToggled(bool active);
    event MeanPriceUpdated(string indexed token, uint256 newMeanPrice);
    
    constructor(
        address _bvixOracle,
        address _evixOracle,
        address initialOwner
    ) Ownable(initialOwner) {
        bvixOracle = IOracle(_bvixOracle);
        evixOracle = IEVIXOracle(_evixOracle);
        lastUpdateTime = block.timestamp;
        simulationActive = false;
    }
    
    /**
     * @notice Start the price simulation
     */
    function startSimulation() external onlyOwner {
        simulationActive = true;
        lastUpdateTime = block.timestamp;
        emit SimulationToggled(true);
    }
    
    /**
     * @notice Stop the price simulation
     */
    function stopSimulation() external onlyOwner {
        simulationActive = false;
        emit SimulationToggled(false);
    }
    
    /**
     * @notice Update both BVIX and EVIX prices with simulated movement
     * @dev Can be called by anyone when simulation is active
     */
    function updatePrices() external {
        require(simulationActive, "Simulation not active");
        require(block.timestamp >= lastUpdateTime + 60, "Too frequent updates");
        
        // Get current prices
        uint256 currentBvixPrice = bvixOracle.getPrice();
        uint256 currentEvixPrice = uint256(evixOracle.getPrice());
        
        // Ensure prices are in valid range to prevent overflow
        if (currentBvixPrice == 0 || currentBvixPrice > type(uint256).max / 2) {
            currentBvixPrice = bvixMeanPrice;
        }
        if (currentEvixPrice == 0 || currentEvixPrice > type(uint256).max / 2) {
            currentEvixPrice = evixMeanPrice;
        }
        
        // Calculate new prices
        uint256 newBvixPrice = _calculateNewPrice(
            currentBvixPrice,
            bvixMeanPrice,
            bvixVolatility,
            BVIX_MIN_PRICE,
            BVIX_MAX_PRICE
        );
        
        uint256 newEvixPrice = _calculateNewPrice(
            currentEvixPrice,
            evixMeanPrice,
            evixVolatility,
            EVIX_MIN_PRICE,
            EVIX_MAX_PRICE
        );
        
        // Apply circuit breakers
        newBvixPrice = _applyCircuitBreaker(currentBvixPrice, newBvixPrice);
        newEvixPrice = _applyCircuitBreaker(currentEvixPrice, newEvixPrice);
        
        // Update oracles
        bvixOracle.updatePrice(newBvixPrice);
        evixOracle.updatePrice(int256(newEvixPrice));
        
        // Update state
        lastUpdateTime = block.timestamp;
        
        // Emit events
        emit PriceUpdated("BVIX", currentBvixPrice, newBvixPrice, block.timestamp);
        emit PriceUpdated("EVIX", currentEvixPrice, newEvixPrice, block.timestamp);
    }
    
    /**
     * @notice Calculate new price with random walk and mean reversion
     */
    function _calculateNewPrice(
        uint256 currentPrice,
        uint256 meanPrice,
        uint256 volatility,
        uint256 minPrice,
        uint256 maxPrice
    ) internal returns (uint256) {
        // Generate pseudo-random movement
        uint256 randomSeed = _getRandomSeed();
        
        // Base random movement (-volatility to +volatility)
        // Use modulo to ensure we don't overflow
        uint256 volatilityRange = volatility * 2;
        int256 randomMovement = int256((randomSeed % volatilityRange) - volatility);
        
        // Mean reversion component (with overflow protection)
        int256 meanReversionComponent = 0;
        if (currentPrice > meanPrice && currentPrice - meanPrice <= currentPrice / 10) {
            // Price above mean, add downward pressure (max 10% of current price)
            uint256 deviation = currentPrice - meanPrice;
            meanReversionComponent = -int256((deviation * meanReversionStrength) / 10000);
        } else if (currentPrice < meanPrice && meanPrice - currentPrice <= currentPrice) {
            // Price below mean, add upward pressure (max 100% of current price)
            uint256 deviation = meanPrice - currentPrice;
            meanReversionComponent = int256((deviation * meanReversionStrength) / 10000);
        }
        
        // Combine movements with overflow protection
        int256 totalMovement = randomMovement + meanReversionComponent;
        
        // Apply movement to price (in basis points) with overflow protection
        uint256 newPrice = currentPrice;
        if (totalMovement > 0) {
            uint256 increase = (currentPrice * uint256(totalMovement)) / 10000;
            if (currentPrice <= type(uint256).max - increase) {
                newPrice = currentPrice + increase;
            } else {
                newPrice = maxPrice; // Cap at maximum
            }
        } else if (totalMovement < 0) {
            uint256 decrease = (currentPrice * uint256(-totalMovement)) / 10000;
            if (currentPrice >= decrease) {
                newPrice = currentPrice - decrease;
            } else {
                newPrice = minPrice; // Floor at minimum
            }
        }
        
        // Ensure price stays within bounds
        if (newPrice < minPrice) newPrice = minPrice;
        if (newPrice > maxPrice) newPrice = maxPrice;
        
        return newPrice;
    }
    
    /**
     * @notice Apply circuit breaker to limit price movement to 1% per minute
     */
    function _applyCircuitBreaker(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        // Calculate maximum allowed change (1%) with overflow protection
        uint256 maxChange = oldPrice / 100; // 1% of old price
        
        if (newPrice > oldPrice) {
            // Price increasing
            if (newPrice - oldPrice > maxChange) {
                return oldPrice + maxChange;
            }
        } else {
            // Price decreasing
            if (oldPrice - newPrice > maxChange) {
                return oldPrice - maxChange;
            }
        }
        
        return newPrice;
    }
    
    /**
     * @notice Generate pseudo-random seed for price movements
     */
    function _getRandomSeed() internal returns (uint256) {
        nonce++;
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            nonce,
            msg.sender
        ))) % 1000; // Limit to prevent overflow in calculations
    }
    
    /**
     * @notice Update mean reversion target for BVIX
     */
    function setBvixMeanPrice(uint256 _meanPrice) external onlyOwner {
        require(_meanPrice >= BVIX_MIN_PRICE && _meanPrice <= BVIX_MAX_PRICE, "Invalid mean price");
        bvixMeanPrice = _meanPrice;
        emit MeanPriceUpdated("BVIX", _meanPrice);
    }
    
    /**
     * @notice Update mean reversion target for EVIX
     */
    function setEvixMeanPrice(uint256 _meanPrice) external onlyOwner {
        require(_meanPrice >= EVIX_MIN_PRICE && _meanPrice <= EVIX_MAX_PRICE, "Invalid mean price");
        evixMeanPrice = _meanPrice;
        emit MeanPriceUpdated("EVIX", _meanPrice);
    }
    
    /**
     * @notice Update volatility parameters
     */
    function setVolatilityParams(
        uint256 _bvixVolatility,
        uint256 _evixVolatility,
        uint256 _meanReversionStrength
    ) external onlyOwner {
        require(_bvixVolatility <= 200, "BVIX volatility too high"); // Max 2%
        require(_evixVolatility <= 200, "EVIX volatility too high"); // Max 2%
        require(_meanReversionStrength <= 100, "Mean reversion too strong"); // Max 1%
        
        bvixVolatility = _bvixVolatility;
        evixVolatility = _evixVolatility;
        meanReversionStrength = _meanReversionStrength;
    }
    
    /**
     * @notice Emergency price update (owner only)
     */
    function emergencyUpdatePrices(uint256 _bvixPrice, uint256 _evixPrice) external onlyOwner {
        require(_bvixPrice >= BVIX_MIN_PRICE && _bvixPrice <= BVIX_MAX_PRICE, "BVIX price out of bounds");
        require(_evixPrice >= EVIX_MIN_PRICE && _evixPrice <= EVIX_MAX_PRICE, "EVIX price out of bounds");
        
        bvixOracle.updatePrice(_bvixPrice);
        evixOracle.updatePrice(int256(_evixPrice));
        
        emit PriceUpdated("BVIX", bvixOracle.getPrice(), _bvixPrice, block.timestamp);
        emit PriceUpdated("EVIX", uint256(evixOracle.getPrice()), _evixPrice, block.timestamp);
    }
    
    /**
     * @notice Get current simulation status
     */
    function getSimulationStatus() external view returns (
        bool active,
        uint256 lastUpdate,
        uint256 nextUpdateTime,
        uint256 bvixPrice,
        uint256 evixPrice
    ) {
        return (
            simulationActive,
            lastUpdateTime,
            lastUpdateTime + 60,
            bvixOracle.getPrice(),
            uint256(evixOracle.getPrice())
        );
    }
} 