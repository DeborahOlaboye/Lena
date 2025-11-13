// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnalyticsRegistry
 * @notice Central registry for dApp registration and management
 * @dev Stores dApp metadata and provides access control for analytics platform
 */
contract AnalyticsRegistry is Ownable {
    // Struct to store dApp information
    struct DAppInfo {
        address owner;
        string name;
        string category;
        address[] contractAddresses;
        bool isActive;
        uint256 registeredAt;
    }

    // Mapping from dApp ID to DAppInfo
    mapping(uint256 => DAppInfo) private dApps;

    // Array to keep track of all dApp IDs
    uint256[] private dAppIds;

    // Counter for dApp IDs
    uint256 private nextDAppId;

    // Mapping to check if an address is a registered dApp owner
    mapping(address => uint256[]) private ownerDApps;

    // Events
    event DAppRegistered(
        uint256 indexed dAppId,
        address indexed owner,
        string name,
        string category,
        uint256 timestamp
    );

    event DAppUpdated(
        uint256 indexed dAppId,
        string name,
        string category,
        uint256 timestamp
    );

    event DAppDeactivated(
        uint256 indexed dAppId,
        uint256 timestamp
    );

    // Custom errors
    error DAppNotFound(uint256 dAppId);
    error DAppNotActive(uint256 dAppId);
    error UnauthorizedAccess(address caller, uint256 dAppId);
    error InvalidName();
    error InvalidCategory();
    error NoContractAddresses();

    constructor() Ownable(msg.sender) {
        nextDAppId = 1; // Start IDs from 1
    }

    /**
     * @notice Register a new dApp in the analytics platform
     * @param name Name of the dApp (3-50 characters)
     * @param category Category of the dApp (DeFi, NFT, Gaming, Social, DAO, Other)
     * @param contractAddresses Array of contract addresses associated with the dApp
     * @return dAppId The ID assigned to the registered dApp
     */
    function registerDApp(
        string memory name,
        string memory category,
        address[] memory contractAddresses
    ) external returns (uint256) {
        // Validation
        if (bytes(name).length < 3 || bytes(name).length > 50) {
            revert InvalidName();
        }
        if (bytes(category).length == 0) {
            revert InvalidCategory();
        }
        if (contractAddresses.length == 0 || contractAddresses.length > 10) {
            revert NoContractAddresses();
        }

        uint256 dAppId = nextDAppId++;

        // Create new dApp
        DAppInfo storage newDApp = dApps[dAppId];
        newDApp.owner = msg.sender;
        newDApp.name = name;
        newDApp.category = category;
        newDApp.contractAddresses = contractAddresses;
        newDApp.isActive = true;
        newDApp.registeredAt = block.timestamp;

        // Track dApp ID
        dAppIds.push(dAppId);
        ownerDApps[msg.sender].push(dAppId);

        emit DAppRegistered(dAppId, msg.sender, name, category, block.timestamp);

        return dAppId;
    }

    /**
     * @notice Update dApp information (only owner can update)
     * @param dAppId ID of the dApp to update
     * @param name New name for the dApp
     * @param category New category for the dApp
     * @param contractAddresses New array of contract addresses
     */
    function updateDApp(
        uint256 dAppId,
        string memory name,
        string memory category,
        address[] memory contractAddresses
    ) external {
        DAppInfo storage dApp = dApps[dAppId];

        if (dApp.registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        if (dApp.owner != msg.sender) {
            revert UnauthorizedAccess(msg.sender, dAppId);
        }
        if (bytes(name).length < 3 || bytes(name).length > 50) {
            revert InvalidName();
        }
        if (bytes(category).length == 0) {
            revert InvalidCategory();
        }
        if (contractAddresses.length == 0 || contractAddresses.length > 10) {
            revert NoContractAddresses();
        }

        dApp.name = name;
        dApp.category = category;
        dApp.contractAddresses = contractAddresses;

        emit DAppUpdated(dAppId, name, category, block.timestamp);
    }

    /**
     * @notice Deactivate a dApp (only owner can deactivate)
     * @param dAppId ID of the dApp to deactivate
     */
    function deactivateDApp(uint256 dAppId) external {
        DAppInfo storage dApp = dApps[dAppId];

        if (dApp.registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        if (dApp.owner != msg.sender) {
            revert UnauthorizedAccess(msg.sender, dAppId);
        }

        dApp.isActive = false;

        emit DAppDeactivated(dAppId, block.timestamp);
    }

    /**
     * @notice Get information about a specific dApp
     * @param dAppId ID of the dApp
     * @return DAppInfo struct containing dApp details
     */
    function getDAppInfo(uint256 dAppId) external view returns (DAppInfo memory) {
        if (dApps[dAppId].registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        return dApps[dAppId];
    }

    /**
     * @notice Get all registered dApp IDs
     * @return Array of all dApp IDs
     */
    function getAllRegisteredDApps() external view returns (uint256[] memory) {
        return dAppIds;
    }

    /**
     * @notice Check if a dApp is registered and active
     * @param dAppId ID of the dApp to check
     * @return bool True if dApp is registered and active
     */
    function isDAppRegistered(uint256 dAppId) external view returns (bool) {
        return dApps[dAppId].registeredAt > 0 && dApps[dAppId].isActive;
    }

    /**
     * @notice Get all dApps owned by a specific address
     * @param owner Address of the owner
     * @return Array of dApp IDs owned by the address
     */
    function getDAppsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerDApps[owner];
    }

    /**
     * @notice Get the total number of registered dApps
     * @return uint256 Total count of dApps
     */
    function getTotalDApps() external view returns (uint256) {
        return dAppIds.length;
    }

    /**
     * @notice Check if an address owns a specific dApp
     * @param owner Address to check
     * @param dAppId ID of the dApp
     * @return bool True if the address owns the dApp
     */
    function isDAppOwner(address owner, uint256 dAppId) external view returns (bool) {
        if (dApps[dAppId].registeredAt == 0) {
            return false;
        }
        return dApps[dAppId].owner == owner;
    }
}
