// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title AnalyticsRegistry
 * @notice Central registry for dApp registration and management
 * @dev Stores dApp metadata and provides access control for analytics platform
 */
contract AnalyticsRegistry is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Struct to store dApp information
    struct DAppInfo {
        address owner;
        string name;
        string[] categories;
        string description;
        string website;
        string logoHash;
        string[] socialLinks;
        address[] contractAddresses;
        bool isActive;
        bool isVerified;
        bool isFeatured;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    // Category management
    EnumerableSet.Bytes32Set private _categories;

    // Mapping from dApp ID to DAppInfo
    mapping(uint256 => DAppInfo) private dApps;

    // Mapping from contract address to dApp ID
    mapping(address => uint256) public contractToDAppId;

    // Mapping from category to dApp IDs
    mapping(string => uint256[]) private categoryToDApps;

    // Array to keep track of all dApp IDs
    uint256[] private dAppIds;

    // Featured dApp IDs
    uint256[] private featuredDAppIds;

    // Counter for dApp IDs
    uint256 private nextDAppId = 1;

    // Mapping from owner to their dApp IDs
    mapping(address => uint256[]) private ownerDApps;

    // Events
    event DAppRegistered(
        uint256 indexed dAppId,
        address indexed owner,
        string name,
        string[] categories,
        uint256 timestamp
    );

    event DAppUpdated(
        uint256 indexed dAppId,
        string name,
        string[] categories,
        uint256 timestamp
    );

    event DAppVerified(
        uint256 indexed dAppId,
        bool isVerified,
        uint256 timestamp
    );

    event DAppFeatured(
        uint256 indexed dAppId,
        bool isFeatured,
        uint256 timestamp
    );

    event DAppDeactivated(
        uint256 indexed dAppId,
        uint256 timestamp
    );

    event CategoryAdded(
        string category,
        uint256 timestamp
    );

    // Custom errors
    error DAppNotFound(uint256 dAppId);
    error DAppNotActive(uint256 dAppId);
    error DAppNotVerified(uint256 dAppId);
    error UnauthorizedAccess(address caller, uint256 dAppId);
    error InvalidName();
    error InvalidCategory();
    error InvalidWebsite();
    error InvalidContractAddress();
    error ContractAlreadyRegistered(address contractAddress);
    error MaxCategoriesExceeded();
    error MaxSocialLinksExceeded();
    error MaxContractAddressesExceeded();

    // Constants
    uint256 public constant MAX_CATEGORIES = 3;
    uint256 public constant MAX_SOCIAL_LINKS = 5;
    uint256 public constant MAX_CONTRACT_ADDRESSES = 10;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new dApp in the analytics platform
     * @param name Name of the dApp (3-50 characters)
     * @param description Description of the dApp (max 500 characters)
     * @param website Website URL of the dApp
     * @param logoHash IPFS hash of the dApp's logo
     * @param categories Array of categories (max 3)
     * @param socialLinks Array of social media links (max 5)
     * @param contractAddresses Array of contract addresses (1-10)
     * @return dAppId The ID assigned to the registered dApp
     */
    function registerDApp(
        string memory name,
        string memory description,
        string memory website,
        string memory logoHash,
        string[] memory categories,
        string[] memory socialLinks,
        address[] memory contractAddresses
    ) external returns (uint256) {
        // Validate input
        if (bytes(name).length < 3 || bytes(name).length > 50) {
            revert InvalidName();
        }
        if (bytes(description).length > 500) {
            revert("Description too long");
        }
        if (bytes(website).length == 0) {
            revert InvalidWebsite();
        }
        if (categories.length == 0 || categories.length > MAX_CATEGORIES) {
            revert MaxCategoriesExceeded();
        }
        if (socialLinks.length > MAX_SOCIAL_LINKS) {
            revert MaxSocialLinksExceeded();
        }
        if (contractAddresses.length == 0 || contractAddresses.length > MAX_CONTRACT_ADDRESSES) {
            revert MaxContractAddressesExceeded();
        }

        // Check for duplicate contract addresses
        for (uint256 i = 0; i < contractAddresses.length; i++) {
            if (contractToDAppId[contractAddresses[i]] != 0) {
                revert ContractAlreadyRegistered(contractAddresses[i]);
            }
        }

        uint256 dAppId = nextDAppId++;

        // Create new dApp
        DAppInfo storage newDApp = dApps[dAppId];
        newDApp.owner = msg.sender;
        newDApp.name = name;
        newDApp.description = description;
        newDApp.website = website;
        newDApp.logoHash = logoHash;
        newDApp.categories = categories;
        newDApp.socialLinks = socialLinks;
        newDApp.contractAddresses = contractAddresses;
        newDApp.isActive = true;
        newDApp.isVerified = false;
        newDApp.isFeatured = false;
        newDApp.registeredAt = block.timestamp;
        newDApp.updatedAt = block.timestamp;

        // Update mappings
        dAppIds.push(dAppId);
        ownerDApps[msg.sender].push(dAppId);

        // Update contract address mapping
        for (uint256 i = 0; i < contractAddresses.length; i++) {
            address contractAddress = contractAddresses[i];
            contractToDAppId[contractAddress] = dAppId;
        }

        // Update category mapping
        for (uint256 i = 0; i < categories.length; i++) {
            string memory category = categories[i];
            categoryToDApps[category].push(dAppId);
            // Add to global categories if not exists
            if (!_categories.contains(keccak256(abi.encodePacked(category)))) {
                _categories.add(keccak256(abi.encodePacked(category)));
                emit CategoryAdded(category, block.timestamp);
            }
        }

        emit DAppRegistered(
            dAppId,
            msg.sender,
            name,
            categories,
            block.timestamp
        );

        return dAppId;
    }

    /**
     * @notice Verify a dApp (only owner can verify)
     * @param dAppId ID of the dApp to verify
     * @param isVerified Whether to verify or unverify the dApp
     */
    function verifyDApp(uint256 dAppId, bool isVerified) external onlyOwner {
        if (dApps[dAppId].registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        dApps[dAppId].isVerified = isVerified;
        dApps[dAppId].updatedAt = block.timestamp;
        emit DAppVerified(dAppId, isVerified, block.timestamp);
    }

    /**
     * @notice Feature a dApp (only owner can feature)
     * @param dAppId ID of the dApp to feature
     * @param isFeatured Whether to feature or unfeature the dApp
     */
    function featureDApp(uint256 dAppId, bool isFeatured) external onlyOwner {
        if (dApps[dAppId].registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        dApps[dAppId].isFeatured = isFeatured;
        dApps[dAppId].updatedAt = block.timestamp;
        
        // Update featured dApps array
        if (isFeatured) {
            featuredDAppIds.push(dAppId);
        } else {
            for (uint256 i = 0; i < featuredDAppIds.length; i++) {
                if (featuredDAppIds[i] == dAppId) {
                    featuredDAppIds[i] = featuredDAppIds[featuredDAppIds.length - 1];
                    featuredDAppIds.pop();
                    break;
                }
            }
        }
        
        emit DAppFeatured(dAppId, isFeatured, block.timestamp);
    }

    /**
     * @notice Update dApp information (only owner can update)
     * @param dAppId ID of the dApp to update
     * @param name New name for the dApp
     * @param description New description for the dApp
     * @param website New website URL
     * @param logoHash New IPFS hash of the logo
     * @param categories New array of categories
     * @param socialLinks New array of social links
     * @param contractAddresses New array of contract addresses
     */
    function updateDApp(
        uint256 dAppId,
        string memory name,
        string memory description,
        string memory website,
        string memory logoHash,
        string[] memory categories,
        string[] memory socialLinks,
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
        if (bytes(description).length > 500) {
            revert("Description too long");
        }
        if (bytes(website).length == 0) {
            revert InvalidWebsite();
        }
        if (categories.length == 0 || categories.length > MAX_CATEGORIES) {
            revert MaxCategoriesExceeded();
        }
        if (socialLinks.length > MAX_SOCIAL_LINKS) {
            revert MaxSocialLinksExceeded();
        }
        if (contractAddresses.length == 0 || contractAddresses.length > MAX_CONTRACT_ADDRESSES) {
            revert MaxContractAddressesExceeded();
        }

        // Remove old contract addresses from mapping
        for (uint256 i = 0; i < dApp.contractAddresses.length; i++) {
            delete contractToDAppId[dApp.contractAddresses[i]];
        }

        // Add new contract addresses to mapping
        for (uint256 i = 0; i < contractAddresses.length; i++) {
            if (contractToDAppId[contractAddresses[i]] != 0 && 
                contractToDAppId[contractAddresses[i]] != dAppId) {
                revert ContractAlreadyRegistered(contractAddresses[i]);
            }
            contractToDAppId[contractAddresses[i]] = dAppId;
        }

        // Remove old categories
        for (uint256 i = 0; i < dApp.categories.length; i++) {
            // Remove dApp from old category
            string storage oldCategory = dApp.categories[i];
            uint256[] storage dAppIdsInCategory = categoryToDApps[oldCategory];
            for (uint256 j = 0; j < dAppIdsInCategory.length; j++) {
                if (dAppIdsInCategory[j] == dAppId) {
                    dAppIdsInCategory[j] = dAppIdsInCategory[dAppIdsInCategory.length - 1];
                    dAppIdsInCategory.pop();
                    break;
                }
            }
        }

        // Add new categories
        for (uint256 i = 0; i < categories.length; i++) {
            string memory category = categories[i];
            categoryToDApps[category].push(dAppId);
            
            // Add to global categories if not exists
            if (!_categories.contains(keccak256(abi.encodePacked(category)))) {
                _categories.add(keccak256(abi.encodePacked(category)));
                emit CategoryAdded(category, block.timestamp);
            }
        }

        // Update dApp info
        dApp.name = name;
        dApp.description = description;
        dApp.website = website;
        dApp.logoHash = logoHash;
        dApp.categories = categories;
        dApp.socialLinks = socialLinks;
        dApp.contractAddresses = contractAddresses;
        dApp.updatedAt = block.timestamp;

        emit DAppUpdated(dAppId, name, categories, block.timestamp);
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
        dApp.updatedAt = block.timestamp;

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
     * @notice Get all featured dApp IDs
     * @return Array of featured dApp IDs
     */
    function getFeaturedDApps() external view returns (uint256[] memory) {
        return featuredDAppIds;
    }

    /**
     * @notice Get dApp IDs by category
     * @param category Category to filter by
     * @return Array of dApp IDs in the specified category
     */
    function getDAppsByCategory(string memory category) external view returns (uint256[] memory) {
        return categoryToDApps[category];
    }

    /**
     * @notice Get all available categories
     * @return Array of all categories
     */
    function getAllCategories() external view returns (string[] memory) {
        string[] memory categories = new string[](_categories.length());
        for (uint256 i = 0; i < _categories.length(); i++) {
            categories[i] = string(abi.encode(_categories.at(i)));
        }
        return categories;
    }

    /**
     * @notice Get dApp ID by contract address
     * @param contractAddress Contract address to look up
     * @return dAppId The ID of the dApp that owns the contract
     */
    function getDAppIdByContract(address contractAddress) external view returns (uint256) {
        uint256 dAppId = contractToDAppId[contractAddress];
        if (dAppId == 0) {
            revert DAppNotFound(0);
        }
        return dAppId;
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
     * @notice Check if a dApp is verified
     * @param dAppId ID of the dApp to check
     * @return bool True if dApp is verified
     */
    function isDAppVerified(uint256 dAppId) external view returns (bool) {
        if (dApps[dAppId].registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        return dApps[dAppId].isVerified;
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
     * @notice Get contract addresses for a dApp
     * @param dAppId ID of the dApp
     * @return Array of contract addresses
     */
    function getDAppContractAddresses(uint256 dAppId) external view returns (address[] memory) {
        if (dApps[dAppId].registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        return dApps[dAppId].contractAddresses;
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
     * @param dAppId ID of the dApp to check
     * @return bool True if the address owns the dApp
     */
    function isDAppOwner(address owner, uint256 dAppId) external view returns (bool) {
        if (dApps[dAppId].registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        return dApps[dAppId].owner == owner;
    }

    /**
     * @notice Transfer ownership of a dApp to a new address
     * @param dAppId ID of the dApp to transfer
     * @param newOwner Address of the new owner
     */
    function transferDAppOwnership(uint256 dAppId, address newOwner) external {
        DAppInfo storage dApp = dApps[dAppId];

        if (dApp.registeredAt == 0) {
            revert DAppNotFound(dAppId);
        }
        if (dApp.owner != msg.sender) {
            revert UnauthorizedAccess(msg.sender, dAppId);
        }
        if (newOwner == address(0)) {
            revert("Invalid new owner");
        }

        // Remove from old owner's list
        uint256[] storage ownerDAppList = ownerDApps[msg.sender];
        for (uint256 i = 0; i < ownerDAppList.length; i++) {
            if (ownerDAppList[i] == dAppId) {
                ownerDAppList[i] = ownerDAppList[ownerDAppList.length - 1];
                ownerDAppList.pop();
                break;
            }
        }

        // Add to new owner's list
        ownerDApps[newOwner].push(dAppId);
        dApp.owner = newOwner;
        dApp.updatedAt = block.timestamp;
    }

    /**
     * @notice Check if a contract address is registered to any dApp
     * @param contractAddress The contract address to check
     * @return bool True if the contract is registered
     */
    function isContractRegistered(address contractAddress) external view returns (bool) {
        return contractToDAppId[contractAddress] != 0;
    }

    /**
     * @notice Get the number of dApps owned by an address
     * @param owner The address to check
     * @return uint256 Number of dApps owned by the address
     */
    function getDAppCountByOwner(address owner) external view returns (uint256) {
        return ownerDApps[owner].length;
    }
}
