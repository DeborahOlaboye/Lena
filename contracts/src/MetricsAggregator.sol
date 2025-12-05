// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./AnalyticsRegistry.sol";
import "./AlertManager.sol";

/**
 * @title MetricsAggregator
 * @notice Stores and computes aggregated analytics metrics
 * @dev Tracks daily metrics for registered dApps
 */
contract MetricsAggregator {
    // Struct to store daily metrics
    // Struct for returning daily metrics (avoids stack too deep issues)
    struct DailyMetricsView {
        uint256 date;
        uint256 activeUsers;
        uint256 totalTx;
        uint256 successfulTx;
        uint256 failedTx;
        uint256 totalGas;
        uint256 uniqueUserCount;
    }
    
    struct DailyMetrics {
        uint256 date; // Unix timestamp normalized to start of day
        uint256 activeUsers; // Number of active users that day
        uint256 totalTx; // Total transactions
        uint256 successfulTx; // Successful transactions
        uint256 failedTx; // Failed transactions
        uint256 totalGas; // Total gas spent
        mapping(address => bool) uniqueUsers; // Track unique users for the day
        uint256 uniqueUserCount; // Count of unique users
    }

    // Reference to the AnalyticsRegistry contract
    AnalyticsRegistry public immutable registry;
    
    // Reference to the AlertManager contract
    AlertManager public alertManager;

    // Mapping from dApp ID => date => metrics
    mapping(uint256 => mapping(uint256 => DailyMetrics)) private dailyMetrics;

    // Mapping from dApp ID to array of dates with metrics
    mapping(uint256 => uint256[]) private dAppDates;

    // Events
    event MetricsUpdated(
        uint256 indexed dAppId,
        uint256 indexed date,
        uint256 totalTx,
        uint256 successfulTx,
        uint256 failedTx,
        uint256 activeUsers,
        uint256 uniqueUsers,
        uint256 totalGas,
        uint256 timestamp,
        uint256 blockNumber
    );
    
    event AlertManagerUpdated(
        address indexed oldAlertManager,
        address indexed newAlertManager
    );

    event TransactionRecorded(
        uint256 indexed dAppId,
        address indexed user,
        bool success,
        uint256 gasUsed,
        uint256 value,
        bytes32 indexed txHash,
        uint256 timestamp,
        uint256 blockNumber
    );

    event UserRecorded(
        uint256 indexed dAppId,
        address indexed user,
        uint256 date,
        uint256 firstSeen,
        uint256 totalInteractions,
        uint256 timestamp,
        uint256 blockNumber
    );

    event DailyMetricsSnapshot(
        uint256 indexed dAppId,
        uint256 indexed date,
        uint256 activeUsers,
        uint256 totalTx,
        uint256 successfulTx,
        uint256 failedTx,
        uint256 totalGas,
        uint256 uniqueUserCount,
        uint256 timestamp,
        uint256 blockNumber
    );

    event HighValueTransaction(
        uint256 indexed dAppId,
        address indexed user,
        uint256 value,
        uint256 gasUsed,
        bytes32 indexed txHash,
        uint256 timestamp,
        uint256 blockNumber
    );

    event MetricsReset(
        uint256 indexed dAppId,
        uint256 date,
        address indexed resetBy,
        uint256 timestamp,
        uint256 blockNumber
    );

    // Track user first seen and interaction counts
    struct UserStats {
        uint256 firstSeen;
        uint256 totalInteractions;
    }

    // Mapping to track user statistics
    mapping(uint256 => mapping(address => UserStats)) private userStats;

    // Custom errors
    error DAppNotRegistered(uint256 dAppId);
    error InvalidAlertManagerAddress();
    error InvalidDateRange();
    error NoMetricsFound();

    /**
     * @notice Constructor to set the AnalyticsRegistry address
     * @param _registry Address of the AnalyticsRegistry contract
     */
    constructor(address _registry) {
        registry = AnalyticsRegistry(_registry);
    }
    
    /**
     * @notice Set the AlertManager contract address
     * @param _alertManager Address of the AlertManager contract
     */
    function setAlertManager(address _alertManager) external {
        require(_alertManager != address(0), "Invalid AlertManager address");
        emit AlertManagerUpdated(address(alertManager), _alertManager);
        alertManager = AlertManager(_alertManager);
    }

    /**
     * @notice Record a transaction for metrics aggregation
     * @param dAppId ID of the dApp
     * @param user Address of the user
     * @param success Whether the transaction was successful
     * @param gasUsed Amount of gas used
     */
    /**
     * @notice Record a transaction and update metrics
     * @param dAppId ID of the dApp
     * @param user Address of the user
     * @param success Whether the transaction was successful
     * @param gasUsed Amount of gas used in the transaction
     * @param value Value transferred in the transaction (in wei)
     * @param txHash Optional transaction hash (can be 0x0 if not available)
     */
    function recordTransaction(
        uint256 dAppId,
        address user,
        bool success,
        uint256 gasUsed,
        uint256 value,
        bytes32 txHash
    ) external {
        // Validate dApp registration
        if (!registry.isDAppRegistered(dAppId)) {
            revert DAppNotRegistered(dAppId);
        }

        uint256 today = _normalizeDate(block.timestamp);

        // Initialize metrics for today if first time
        DailyMetrics storage metrics = dailyMetrics[dAppId][today];

        if (metrics.date == 0) {
            metrics.date = today;
            dAppDates[dAppId].push(today);
        }

        // Update transaction counts
        metrics.totalTx++;
        if (success) {
            metrics.successfulTx++;
        } else {
            metrics.failedTx++;
        }

        // Update gas
        metrics.totalGas += gasUsed;

        // Track unique user
        if (!metrics.uniqueUsers[user]) {
            metrics.uniqueUsers[user] = true;
            metrics.uniqueUserCount++;
            metrics.activeUsers++;
        }

// Update user stats
        _updateUserStats(dAppId, user);

        // Emit transaction event
        emit TransactionRecorded(
            dAppId,
            user,
            success,
            gasUsed,
            value,
            txHash,
            block.timestamp,
            block.number
        );
        
        // Check for alerts if AlertManager is set
        if (address(alertManager) != address(0)) {
            try alertManager.checkForAlerts(
                dAppId,
                _normalizeDate(block.timestamp),
                gasUsed,
                success
            ) {} catch {}
        }

        // Emit high value transaction event if applicable
        if (value > 1 ether) {
            emit HighValueTransaction(
                dAppId,
                user,
                value,
                gasUsed,
                txHash,
                block.timestamp,
                block.number
            );
        }

        // Emit metrics updated event
        emit MetricsUpdated(
            dAppId,
            today,
            metrics.totalTx,
            metrics.successfulTx,
            metrics.failedTx,
            metrics.activeUsers,
            metrics.uniqueUserCount,
            metrics.totalGas,
            block.timestamp,
            block.number
        );

        // Emit daily snapshot if this is the first transaction of the day
        if (metrics.totalTx == 1) {
            _emitDailySnapshot(dAppId, today, metrics);
        }
    }

    /**
     * @notice Record a user activity
     * @param dAppId ID of the dApp
     * @param user Address of the user
     */
    /**
     * @notice Record a user interaction
     * @param dAppId ID of the dApp
     * @param user Address of the user
     */
    function recordUser(uint256 dAppId, address user) external {
        // Validate dApp registration
        if (!registry.isDAppRegistered(dAppId)) {
            revert DAppNotRegistered(dAppId);
        }

        uint256 today = _normalizeDate(block.timestamp);

        // Initialize metrics for today if first time
        DailyMetrics storage metrics = dailyMetrics[dAppId][today];

        if (metrics.date == 0) {
            metrics.date = today;
            dAppDates[dAppId].push(today);
        }

        // Track unique user
        if (!metrics.uniqueUsers[user]) {
            metrics.uniqueUsers[user] = true;
            metrics.uniqueUserCount++;
            metrics.activeUsers++;

            // Update user stats
            _updateUserStats(dAppId, user);
            
            emit UserRecorded(
                dAppId,
                user,
                today,
                userStats[dAppId][user].firstSeen,
                userStats[dAppId][user].totalInteractions,
                block.timestamp,
                block.number
            );
            
            emit MetricsUpdated(
                dAppId,
                today,
                metrics.totalTx,
                metrics.successfulTx,
                metrics.failedTx,
                metrics.activeUsers,
                metrics.uniqueUserCount,
                metrics.totalGas,
                block.timestamp,
                block.number
            );
            
            // Emit daily snapshot if this is the first user of the day
            if (metrics.uniqueUserCount == 1) {
                _emitDailySnapshot(dAppId, today, metrics);
            }
        }
    }

    /**
     * @notice Get daily metrics for a specific date
     * @param dAppId ID of the dApp
     * @param date Unix timestamp (will be normalized to start of day)
     * @return date Normalized date
     * @return activeUsers Number of active users
     * @return totalTx Total transactions
     * @return successfulTx Successful transactions
     * @return failedTx Failed transactions
     * @return totalGas Total gas spent
     * @return uniqueUserCount Unique user count
     */
    /**
     * @notice Get daily metrics for a specific date
     * @param dAppId ID of the dApp
     * @param date Unix timestamp (will be normalized to start of day)
     * @return metrics Struct containing all daily metrics
     */
    function getDailyMetrics(uint256 dAppId, uint256 date)
        external
        view
        returns (DailyMetricsView memory)
    {
        uint256 normalizedDate = _normalizeDate(date);
        DailyMetrics storage metrics = dailyMetrics[dAppId][normalizedDate];
        
        return DailyMetricsView({
            date: metrics.date,
            activeUsers: metrics.activeUsers,
            totalTx: metrics.totalTx,
            successfulTx: metrics.successfulTx,
            failedTx: metrics.failedTx,
            totalGas: metrics.totalGas,
            uniqueUserCount: metrics.uniqueUserCount
        });
    }
    
    /**
     * @notice Get user statistics for a specific dApp
     * @param dAppId ID of the dApp
     * @param user Address of the user
     * @return firstSeen Timestamp of first interaction
     * @return totalInteractions Total number of interactions
     */
    function getUserStats(uint256 dAppId, address user)
        external
        view
        returns (uint256 firstSeen, uint256 totalInteractions)
    {
        UserStats storage stats = userStats[dAppId][user];
        return (stats.firstSeen, stats.totalInteractions);
    }

    /**
     * @notice Get current metrics (for today)
     * @param dAppId ID of the dApp
     * @return date Normalized date
     * @return activeUsers Number of active users
     * @return totalTx Total transactions
     * @return successfulTx Successful transactions
     * @return failedTx Failed transactions
     * @return totalGas Total gas spent
     * @return uniqueUserCount Unique user count
     */
    function getCurrentMetrics(uint256 dAppId)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 today = _normalizeDate(block.timestamp);
        DailyMetrics storage metrics = dailyMetrics[dAppId][today];

        return (
            metrics.date,
            metrics.activeUsers,
            metrics.totalTx,
            metrics.successfulTx,
            metrics.failedTx,
            metrics.totalGas,
            metrics.uniqueUserCount
        );
    }

    /**
     * @notice Get metrics for a date range
     * @param dAppId ID of the dApp
     * @param startDate Start date (Unix timestamp)
     * @param endDate End date (Unix timestamp)
     * @return dates Array of dates
     * @return activeUsersArray Array of active users per date
     * @return totalTxArray Array of total transactions per date
     * @return successfulTxArray Array of successful transactions per date
     * @return failedTxArray Array of failed transactions per date
     * @return totalGasArray Array of total gas per date
     * @return uniqueUserCountArray Array of unique user counts per date
     */
    function getMetricsRange(
        uint256 dAppId,
        uint256 startDate,
        uint256 endDate
    )
        external
        view
        returns (
            uint256[] memory dates,
            uint256[] memory activeUsersArray,
            uint256[] memory totalTxArray,
            uint256[] memory successfulTxArray,
            uint256[] memory failedTxArray,
            uint256[] memory totalGasArray,
            uint256[] memory uniqueUserCountArray
        )
    {
        uint256 normalizedStart = _normalizeDate(startDate);
        uint256 normalizedEnd = _normalizeDate(endDate);

        if (normalizedStart > normalizedEnd) {
            revert InvalidDateRange();
        }

        // Calculate number of days
        uint256 dayCount = ((normalizedEnd - normalizedStart) / 1 days) + 1;

        // Initialize arrays
        dates = new uint256[](dayCount);
        activeUsersArray = new uint256[](dayCount);
        totalTxArray = new uint256[](dayCount);
        successfulTxArray = new uint256[](dayCount);
        failedTxArray = new uint256[](dayCount);
        totalGasArray = new uint256[](dayCount);
        uniqueUserCountArray = new uint256[](dayCount);

        // Populate arrays
        for (uint256 i = 0; i < dayCount; i++) {
            uint256 currentDate = normalizedStart + (i * 1 days);
            DailyMetrics storage metrics = dailyMetrics[dAppId][currentDate];

            dates[i] = currentDate;
            activeUsersArray[i] = metrics.activeUsers;
            totalTxArray[i] = metrics.totalTx;
            successfulTxArray[i] = metrics.successfulTx;
            failedTxArray[i] = metrics.failedTx;
            totalGasArray[i] = metrics.totalGas;
            uniqueUserCountArray[i] = metrics.uniqueUserCount;
        }

        return (
            dates,
            activeUsersArray,
            totalTxArray,
            successfulTxArray,
            failedTxArray,
            totalGasArray,
            uniqueUserCountArray
        );
    }

    /**
     * @notice Check if a user was active on a specific date
     * @param dAppId ID of the dApp
     * @param user Address of the user
     * @param date Unix timestamp
     * @return bool True if user was active that day
     */
    function wasUserActive(
        uint256 dAppId,
        address user,
        uint256 date
    ) external view returns (bool) {
        uint256 normalizedDate = _normalizeDate(date);
        return dailyMetrics[dAppId][normalizedDate].uniqueUsers[user];
    }

    /**
     * @notice Get all dates with recorded metrics for a dApp
     * @param dAppId ID of the dApp
     * @return Array of dates (normalized timestamps)
     */
    function getDAppMetricsDates(uint256 dAppId) external view returns (uint256[] memory) {
        return dAppDates[dAppId];
    }

    /**
     * @notice Get the success rate for a specific date
     * @param dAppId ID of the dApp
     * @param date Unix timestamp
     * @return uint256 Success rate as a percentage (0-100) with 2 decimals (e.g., 9543 = 95.43%)
     */
    function getSuccessRate(uint256 dAppId, uint256 date) external view returns (uint256) {
        uint256 normalizedDate = _normalizeDate(date);
        DailyMetrics storage metrics = dailyMetrics[dAppId][normalizedDate];

        if (metrics.totalTx == 0) {
            return 0;
        }

        return (metrics.successfulTx * 10000) / metrics.totalTx;
    }

    /**
     * @notice Get average gas per transaction for a specific date
     * @param dAppId ID of the dApp
     * @param date Unix timestamp
     * @return uint256 Average gas per transaction
     */
    function getAverageGas(uint256 dAppId, uint256 date) external view returns (uint256) {
        uint256 normalizedDate = _normalizeDate(date);
        DailyMetrics storage metrics = dailyMetrics[dAppId][normalizedDate];

        if (metrics.totalTx == 0) {
            return 0;
        }

        return metrics.totalGas / metrics.totalTx;
    }

    /**
     * @notice Normalize a timestamp to the start of the day (midnight UTC)
     * @param timestamp Unix timestamp
     * @return uint256 Normalized timestamp
     */
    /**
     * @notice Update user statistics
     * @param dAppId ID of the dApp
     * @param user Address of the user
     */
    function _updateUserStats(uint256 dAppId, address user) private {
        UserStats storage stats = userStats[dAppId][user];
        
        // If this is the first time we've seen this user
        if (stats.firstSeen == 0) {
            stats.firstSeen = block.timestamp;
        }
        
        // Increment interaction count
        stats.totalInteractions++;
    }
    
    /**
     * @notice Emit a daily metrics snapshot
     * @param dAppId ID of the dApp
     * @param date Normalized date
     * @param metrics DailyMetrics storage reference
     */
    function _emitDailySnapshot(
        uint256 dAppId,
        uint256 date,
        DailyMetrics storage metrics
    ) private {
        emit DailyMetricsSnapshot(
            dAppId,
            date,
            metrics.activeUsers,
            metrics.totalTx,
            metrics.successfulTx,
            metrics.failedTx,
            metrics.totalGas,
            metrics.uniqueUserCount,
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @notice Normalize a timestamp to the start of the day
     * @param timestamp Unix timestamp
     * @return Normalized timestamp (start of day)
     */
    function _normalizeDate(uint256 timestamp) private pure returns (uint256) {
        return (timestamp / 1 days) * 1 days;
    }
}
