// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./MetricsAggregator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AlertManager
 * @notice Manages alerts for unusual on-chain activity
 * @dev Monitors gas usage and transaction failure rates, triggers alerts when thresholds are exceeded
 */
contract AlertManager is Ownable {
    // Reference to the MetricsAggregator contract
    MetricsAggregator public immutable metricsAggregator;

    // Alerter role that can receive alerts
    mapping(address => bool) public alerters;

    // Alert configuration for each dApp
    struct AlertConfig {
        bool isActive;
        uint256 gasThreshold; // Threshold for high gas usage (in wei)
        uint256 failureRateThreshold; // Threshold for high failure rate (percentage, 0-100)
        uint256 minTransactions; // Minimum number of transactions before checking failure rate
    }

    // dApp ID => AlertConfig
    mapping(uint256 => AlertConfig) public alertConfigs;

    // Events
    event AlertTriggered(
        uint256 indexed dAppId,
        string alertType,
        uint256 value,
        uint256 threshold,
        uint256 timestamp,
        uint256 blockNumber
    );

    event AlertConfigUpdated(
        uint256 indexed dAppId,
        uint256 gasThreshold,
        uint256 failureRateThreshold,
        uint256 minTransactions,
        bool isActive
    );

    event AlerterUpdated(
        address indexed alerter,
        bool isActive
    );

    // Custom errors
    error OnlyMetricsAggregator();
    error OnlyAlerter();
    error InvalidThreshold();
    error InvalidDApp();

    // Modifiers
    modifier onlyMetricsAggregator() {
        if (msg.sender != address(metricsAggregator)) {
            revert OnlyMetricsAggregator();
        }
        _;
    }

    modifier onlyAlerter() {
        if (!alerters[msg.sender] && msg.sender != owner()) {
            revert OnlyAlerter();
        }
        _;
    }

    /**
     * @dev Constructor
     * @param _metricsAggregator Address of the MetricsAggregator contract
     */
    constructor(address _metricsAggregator) Ownable(msg.sender) {
        require(_metricsAggregator != address(0), "Invalid MetricsAggregator address");
        metricsAggregator = MetricsAggregator(_metricsAggregator);
        
        // Owner is an alerter by default
        alerters[msg.sender] = true;
    }

    /**
     * @notice Check for alerts after a transaction is processed
     * @dev Called by MetricsAggregator after processing a transaction
     * @param dAppId ID of the dApp
     * @param date Date of the transaction
     * @param gasUsed Gas used in the transaction
     * @param success Whether the transaction was successful
     */
    function checkForAlerts(
        uint256 dAppId,
        uint256 date,
        uint256 gasUsed,
        bool success
    ) external onlyMetricsAggregator {
        AlertConfig storage config = alertConfigs[dAppId];
        
        // Skip if alerts are not active for this dApp
        if (!config.isActive) {
            return;
        }

        // Check for high gas usage
        if (gasUsed > config.gasThreshold) {
            emit AlertTriggered(
                dAppId,
                "HIGH_GAS_USAGE",
                gasUsed,
                config.gasThreshold,
                block.timestamp,
                block.number
            );
        }

        // Get metrics for the day to check failure rate
        (uint256 successCount, uint256 totalCount) = _getDailyMetrics(dAppId, date);
        
        // Only check failure rate if we have enough transactions
        if (totalCount >= config.minTransactions) {
            uint256 failureRate = ((totalCount - successCount) * 100) / totalCount;
            
            if (failureRate > config.failureRateThreshold) {
                emit AlertTriggered(
                    dAppId,
                    "HIGH_FAILURE_RATE",
                    failureRate,
                    config.failureRateThreshold,
                    block.timestamp,
                    block.number
                );
            }
        }
    }

    /**
     * @notice Update alert configuration for a dApp
     * @param dAppId ID of the dApp
     * @param gasThreshold Threshold for high gas usage (in wei)
     * @param failureRateThreshold Threshold for high failure rate (percentage, 0-100)
     * @param minTransactions Minimum number of transactions before checking failure rate
     * @param isActive Whether alerts are active for this dApp
     */
    function setAlertConfig(
        uint256 dAppId,
        uint256 gasThreshold,
        uint256 failureRateThreshold,
        uint256 minTransactions,
        bool isActive
    ) external onlyAlerter {
        if (failureRateThreshold > 100) {
            revert InvalidThreshold();
        }

        if (minTransactions == 0) {
            revert InvalidThreshold();
        }

        alertConfigs[dAppId] = AlertConfig({
            isActive: isActive,
            gasThreshold: gasThreshold,
            failureRateThreshold: failureRateThreshold,
            minTransactions: minTransactions
        });

        emit AlertConfigUpdated(
            dAppId,
            gasThreshold,
            failureRateThreshold,
            minTransactions,
            isActive
        );
    }

    /**
     * @notice Add or remove an alerter
     * @param alerter Address of the alerter
     * @param isActive Whether the alerter is active
     */
    function setAlerter(address alerter, bool isActive) external onlyOwner {
        require(alerter != address(0), "Invalid alerter address");
        alerters[alerter] = isActive;
        emit AlerterUpdated(alerter, isActive);
    }

    /**
     * @notice Get daily metrics for a dApp
     * @dev Internal function to get daily metrics from MetricsAggregator
     */
    function _getDailyMetrics(
        uint256 dAppId,
        uint256 date
    ) internal view returns (uint256 successCount, uint256 totalCount) {
        // This is a simplified implementation. In a real scenario, you would call
        // the appropriate functions on the MetricsAggregator contract
        try metricsAggregator.getDailyMetrics(dAppId, date) returns (
            uint256,
            uint256,
            uint256,
            uint256 success,
            uint256 failed,
            uint256
        ) {
            return (success, success + failed);
        } catch {
            return (0, 0);
        }
    }
}
