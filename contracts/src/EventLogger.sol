// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./AnalyticsRegistry.sol";

/**
 * @title EventLogger
 * @notice Logs analytics events from registered dApps
 * @dev Integrates with AnalyticsRegistry to validate dApp registration
 */
contract EventLogger {
    // Struct to store analytics events
    struct AnalyticsEvent {
        uint256 eventId;
        uint256 dAppId;
        address user;
        string eventType;
        string eventData;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // Reference to the AnalyticsRegistry contract
    AnalyticsRegistry public immutable registry;

    // Mapping from event ID to AnalyticsEvent
    mapping(uint256 => AnalyticsEvent) private events;

    // Array of all event IDs
    uint256[] private eventIds;

    // Counter for event IDs
    uint256 private nextEventId;

    // Mapping from dApp ID to event IDs
    mapping(uint256 => uint256[]) private dAppEvents;

    // Mapping from user address to event IDs
    mapping(address => uint256[]) private userEvents;

    // Events
    event EventLogged(
        uint256 indexed eventId,
        uint256 indexed dAppId,
        address indexed user,
        string eventType,
        uint256 timestamp
    );

    event TransactionLogged(
        uint256 indexed eventId,
        uint256 indexed dAppId,
        address indexed user,
        bytes32 txHash,
        uint256 timestamp
    );

    event UserActionLogged(
        uint256 indexed eventId,
        uint256 indexed dAppId,
        address indexed user,
        string action,
        uint256 timestamp
    );

    event BatchEventsLogged(
        uint256 indexed dAppId,
        uint256 eventCount,
        uint256 timestamp
    );

    // Custom errors
    error DAppNotRegistered(uint256 dAppId);
    error InvalidEventType();
    error InvalidEventData();
    error NoEventsToLog();

    /**
     * @notice Constructor to set the AnalyticsRegistry address
     * @param _registry Address of the AnalyticsRegistry contract
     */
    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry address");
        registry = AnalyticsRegistry(_registry);
        nextEventId = 1; // Start IDs from 1
    }

    /**
     * @notice Log a general analytics event
     * @param dAppId ID of the dApp logging the event
     * @param user Address of the user involved
     * @param eventType Type of event (e.g., "click", "view", "submit")
     * @param eventData Additional JSON data about the event
     * @return eventId The ID of the logged event
     */
    function logEvent(
        uint256 dAppId,
        address user,
        string memory eventType,
        string memory eventData
    ) public returns (uint256) {
        // Validate dApp registration
        if (!registry.isDAppRegistered(dAppId)) {
            revert DAppNotRegistered(dAppId);
        }
        if (bytes(eventType).length == 0) {
            revert InvalidEventType();
        }

        uint256 eventId = nextEventId++;

        // Create new event
        AnalyticsEvent storage newEvent = events[eventId];
        newEvent.eventId = eventId;
        newEvent.dAppId = dAppId;
        newEvent.user = user;
        newEvent.eventType = eventType;
        newEvent.eventData = eventData;
        newEvent.timestamp = block.timestamp;
        newEvent.blockNumber = block.number;

        // Track event
        eventIds.push(eventId);
        dAppEvents[dAppId].push(eventId);
        if (user != address(0)) {
            userEvents[user].push(eventId);
        }

        emit EventLogged(eventId, dAppId, user, eventType, block.timestamp);

        return eventId;
    }

    /**
     * @notice Log a transaction event
     * @param dAppId ID of the dApp
     * @param user Address of the user
     * @param txHash Hash of the transaction
     * @param eventData Additional data about the transaction
     * @return eventId The ID of the logged event
     */
    function logTransaction(
        uint256 dAppId,
        address user,
        bytes32 txHash,
        string memory eventData
    ) external returns (uint256) {
        uint256 eventId = logEvent(dAppId, user, "transaction", eventData);

        emit TransactionLogged(eventId, dAppId, user, txHash, block.timestamp);

        return eventId;
    }

    /**
     * @notice Log a user action event
     * @param dAppId ID of the dApp
     * @param user Address of the user
     * @param action Description of the action
     * @param eventData Additional data about the action
     * @return eventId The ID of the logged event
     */
    function logUserAction(
        uint256 dAppId,
        address user,
        string memory action,
        string memory eventData
    ) external returns (uint256) {
        uint256 eventId = logEvent(dAppId, user, "user_action", eventData);

        emit UserActionLogged(eventId, dAppId, user, action, block.timestamp);

        return eventId;
    }

    /**
     * @notice Log multiple events in a single transaction (gas-efficient)
     * @param dAppId ID of the dApp
     * @param users Array of user addresses
     * @param eventTypes Array of event types
     * @param eventDataArray Array of event data
     * @return eventIds Array of logged event IDs
     */
    function batchLogEvents(
        uint256 dAppId,
        address[] memory users,
        string[] memory eventTypes,
        string[] memory eventDataArray
    ) external returns (uint256[] memory) {
        // Validate dApp registration
        if (!registry.isDAppRegistered(dAppId)) {
            revert DAppNotRegistered(dAppId);
        }

        uint256 length = users.length;
        if (length == 0 || length != eventTypes.length || length != eventDataArray.length) {
            revert NoEventsToLog();
        }

        uint256[] memory newEventIds = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            if (bytes(eventTypes[i]).length == 0) {
                revert InvalidEventType();
            }

            uint256 eventId = nextEventId++;

            // Create new event
            AnalyticsEvent storage newEvent = events[eventId];
            newEvent.eventId = eventId;
            newEvent.dAppId = dAppId;
            newEvent.user = users[i];
            newEvent.eventType = eventTypes[i];
            newEvent.eventData = eventDataArray[i];
            newEvent.timestamp = block.timestamp;
            newEvent.blockNumber = block.number;

            // Track event
            eventIds.push(eventId);
            dAppEvents[dAppId].push(eventId);
            if (users[i] != address(0)) {
                userEvents[users[i]].push(eventId);
            }

            newEventIds[i] = eventId;

            emit EventLogged(eventId, dAppId, users[i], eventTypes[i], block.timestamp);
        }

        emit BatchEventsLogged(dAppId, length, block.timestamp);

        return newEventIds;
    }

    /**
     * @notice Get events by dApp ID
     * @param dAppId ID of the dApp
     * @param limit Maximum number of events to return (0 for all)
     * @return Array of event IDs
     */
    function getEventsByDApp(uint256 dAppId, uint256 limit) external view returns (uint256[] memory) {
        uint256[] memory dAppEventList = dAppEvents[dAppId];

        if (limit == 0 || limit >= dAppEventList.length) {
            return dAppEventList;
        }

        // Return most recent events up to limit
        uint256[] memory limitedEvents = new uint256[](limit);
        uint256 startIndex = dAppEventList.length - limit;

        for (uint256 i = 0; i < limit; i++) {
            limitedEvents[i] = dAppEventList[startIndex + i];
        }

        return limitedEvents;
    }

    /**
     * @notice Get events by user address
     * @param user Address of the user
     * @param limit Maximum number of events to return (0 for all)
     * @return Array of event IDs
     */
    function getEventsByUser(address user, uint256 limit) external view returns (uint256[] memory) {
        uint256[] memory userEventList = userEvents[user];

        if (limit == 0 || limit >= userEventList.length) {
            return userEventList;
        }

        // Return most recent events up to limit
        uint256[] memory limitedEvents = new uint256[](limit);
        uint256 startIndex = userEventList.length - limit;

        for (uint256 i = 0; i < limit; i++) {
            limitedEvents[i] = userEventList[startIndex + i];
        }

        return limitedEvents;
    }

    /**
     * @notice Get event details by event ID
     * @param eventId ID of the event
     * @return AnalyticsEvent struct
     */
    function getEvent(uint256 eventId) external view returns (AnalyticsEvent memory) {
        require(events[eventId].eventId > 0, "Event not found");
        return events[eventId];
    }

    /**
     * @notice Get multiple events by their IDs
     * @param _eventIds Array of event IDs
     * @return Array of AnalyticsEvent structs
     */
    function getEvents(uint256[] memory _eventIds) external view returns (AnalyticsEvent[] memory) {
        AnalyticsEvent[] memory result = new AnalyticsEvent[](_eventIds.length);

        for (uint256 i = 0; i < _eventIds.length; i++) {
            if (events[_eventIds[i]].eventId > 0) {
                result[i] = events[_eventIds[i]];
            }
        }

        return result;
    }

    /**
     * @notice Get total number of events logged
     * @return uint256 Total event count
     */
    function getTotalEvents() external view returns (uint256) {
        return eventIds.length;
    }

    /**
     * @notice Get total number of events for a specific dApp
     * @param dAppId ID of the dApp
     * @return uint256 Total event count for the dApp
     */
    function getDAppEventCount(uint256 dAppId) external view returns (uint256) {
        return dAppEvents[dAppId].length;
    }

    /**
     * @notice Get total number of events for a specific user
     * @param user Address of the user
     * @return uint256 Total event count for the user
     */
    function getUserEventCount(address user) external view returns (uint256) {
        return userEvents[user].length;
    }
}
