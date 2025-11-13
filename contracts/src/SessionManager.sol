// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./AnalyticsRegistry.sol";

/**
 * @title SessionManager
 * @notice Tracks user sessions and engagement for registered dApps
 * @dev Integrates with AnalyticsRegistry to validate dApp registration
 */
contract SessionManager {
    // Struct to store session information
    struct Session {
        uint256 sessionId;
        address user;
        uint256 dAppId;
        uint256 startTime;
        uint256 endTime;
        uint256 transactionCount;
        uint256 gasSpent;
        bool isActive;
    }

    // Reference to the AnalyticsRegistry contract
    AnalyticsRegistry public immutable registry;

    // Mapping from session ID to Session
    mapping(uint256 => Session) private sessions;

    // Counter for session IDs
    uint256 private nextSessionId;

    // Mapping to track active session for user+dApp combination
    mapping(address => mapping(uint256 => uint256)) private activeUserDAppSession;

    // Mapping from user address to their session IDs
    mapping(address => uint256[]) private userSessions;

    // Mapping from dApp ID to active session IDs
    mapping(uint256 => uint256[]) private dAppActiveSessions;

    // Events
    event SessionStarted(
        uint256 indexed sessionId,
        address indexed user,
        uint256 indexed dAppId,
        uint256 timestamp
    );

    event SessionEnded(
        uint256 indexed sessionId,
        address indexed user,
        uint256 indexed dAppId,
        uint256 duration,
        uint256 transactionCount,
        uint256 timestamp
    );

    event SessionUpdated(
        uint256 indexed sessionId,
        uint256 transactionCount,
        uint256 gasSpent,
        uint256 timestamp
    );

    // Custom errors
    error DAppNotRegistered(uint256 dAppId);
    error SessionAlreadyActive(address user, uint256 dAppId);
    error SessionNotFound(uint256 sessionId);
    error SessionNotActive(uint256 sessionId);
    error UnauthorizedSessionAccess(address caller, uint256 sessionId);

    /**
     * @notice Constructor to set the AnalyticsRegistry address
     * @param _registry Address of the AnalyticsRegistry contract
     */
    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry address");
        registry = AnalyticsRegistry(_registry);
        nextSessionId = 1; // Start IDs from 1
    }

    /**
     * @notice Start a new session for a user in a dApp
     * @param dAppId ID of the dApp
     * @return sessionId The ID of the started session
     */
    function startSession(uint256 dAppId) external returns (uint256) {
        // Validate dApp registration
        if (!registry.isDAppRegistered(dAppId)) {
            revert DAppNotRegistered(dAppId);
        }

        // Check for existing active session
        uint256 existingSessionId = activeUserDAppSession[msg.sender][dAppId];
        if (existingSessionId > 0 && sessions[existingSessionId].isActive) {
            revert SessionAlreadyActive(msg.sender, dAppId);
        }

        uint256 sessionId = nextSessionId++;

        // Create new session
        Session storage newSession = sessions[sessionId];
        newSession.sessionId = sessionId;
        newSession.user = msg.sender;
        newSession.dAppId = dAppId;
        newSession.startTime = block.timestamp;
        newSession.endTime = 0;
        newSession.transactionCount = 0;
        newSession.gasSpent = 0;
        newSession.isActive = true;

        // Track session
        activeUserDAppSession[msg.sender][dAppId] = sessionId;
        userSessions[msg.sender].push(sessionId);
        dAppActiveSessions[dAppId].push(sessionId);

        emit SessionStarted(sessionId, msg.sender, dAppId, block.timestamp);

        return sessionId;
    }

    /**
     * @notice End an active session
     * @param sessionId ID of the session to end
     */
    function endSession(uint256 sessionId) external {
        Session storage session = sessions[sessionId];

        if (session.sessionId == 0) {
            revert SessionNotFound(sessionId);
        }
        if (session.user != msg.sender) {
            revert UnauthorizedSessionAccess(msg.sender, sessionId);
        }
        if (!session.isActive) {
            revert SessionNotActive(sessionId);
        }

        // End the session
        session.isActive = false;
        session.endTime = block.timestamp;

        // Clear active session tracking
        activeUserDAppSession[session.user][session.dAppId] = 0;

        // Remove from active sessions list
        _removeFromActiveSessions(session.dAppId, sessionId);

        uint256 duration = session.endTime - session.startTime;

        emit SessionEnded(
            sessionId,
            session.user,
            session.dAppId,
            duration,
            session.transactionCount,
            block.timestamp
        );
    }

    /**
     * @notice Update session metrics (transaction count and gas spent)
     * @param sessionId ID of the session to update
     * @param additionalTxCount Number of transactions to add
     * @param additionalGas Amount of gas to add
     */
    function updateSession(
        uint256 sessionId,
        uint256 additionalTxCount,
        uint256 additionalGas
    ) external {
        Session storage session = sessions[sessionId];

        if (session.sessionId == 0) {
            revert SessionNotFound(sessionId);
        }
        if (session.user != msg.sender) {
            revert UnauthorizedSessionAccess(msg.sender, sessionId);
        }
        if (!session.isActive) {
            revert SessionNotActive(sessionId);
        }

        session.transactionCount += additionalTxCount;
        session.gasSpent += additionalGas;

        emit SessionUpdated(
            sessionId,
            session.transactionCount,
            session.gasSpent,
            block.timestamp
        );
    }

    /**
     * @notice Get the active session for a user in a specific dApp
     * @param user Address of the user
     * @param dAppId ID of the dApp
     * @return Session struct (returns empty struct if no active session)
     */
    function getActiveSession(address user, uint256 dAppId) external view returns (Session memory) {
        uint256 sessionId = activeUserDAppSession[user][dAppId];

        if (sessionId > 0 && sessions[sessionId].isActive) {
            return sessions[sessionId];
        }

        // Return empty session
        return Session(0, address(0), 0, 0, 0, 0, 0, false);
    }

    /**
     * @notice Get all sessions for a user
     * @param user Address of the user
     * @return Array of session IDs
     */
    function getUserSessions(address user) external view returns (uint256[] memory) {
        return userSessions[user];
    }

    /**
     * @notice Get all active sessions for a dApp
     * @param dAppId ID of the dApp
     * @return Array of session IDs
     */
    function getDAppActiveSessions(uint256 dAppId) external view returns (uint256[] memory) {
        return dAppActiveSessions[dAppId];
    }

    /**
     * @notice Get session details by session ID
     * @param sessionId ID of the session
     * @return Session struct
     */
    function getSession(uint256 sessionId) external view returns (Session memory) {
        if (sessions[sessionId].sessionId == 0) {
            revert SessionNotFound(sessionId);
        }
        return sessions[sessionId];
    }

    /**
     * @notice Get multiple sessions by their IDs
     * @param sessionIds Array of session IDs
     * @return Array of Session structs
     */
    function getSessions(uint256[] memory sessionIds) external view returns (Session[] memory) {
        Session[] memory result = new Session[](sessionIds.length);

        for (uint256 i = 0; i < sessionIds.length; i++) {
            if (sessions[sessionIds[i]].sessionId > 0) {
                result[i] = sessions[sessionIds[i]];
            }
        }

        return result;
    }

    /**
     * @notice Check if a session is active
     * @param sessionId ID of the session
     * @return bool True if the session is active
     */
    function isSessionActive(uint256 sessionId) external view returns (bool) {
        return sessions[sessionId].sessionId > 0 && sessions[sessionId].isActive;
    }

    /**
     * @notice Get the total number of sessions for a user
     * @param user Address of the user
     * @return uint256 Total session count
     */
    function getUserSessionCount(address user) external view returns (uint256) {
        return userSessions[user].length;
    }

    /**
     * @notice Get the number of active sessions for a dApp
     * @param dAppId ID of the dApp
     * @return uint256 Active session count
     */
    function getDAppActiveSessionCount(uint256 dAppId) external view returns (uint256) {
        return dAppActiveSessions[dAppId].length;
    }

    /**
     * @notice Get session duration (in seconds)
     * @param sessionId ID of the session
     * @return uint256 Duration in seconds (ongoing sessions use current time)
     */
    function getSessionDuration(uint256 sessionId) external view returns (uint256) {
        Session storage session = sessions[sessionId];

        if (session.sessionId == 0) {
            revert SessionNotFound(sessionId);
        }

        if (session.isActive) {
            return block.timestamp - session.startTime;
        } else {
            return session.endTime - session.startTime;
        }
    }

    /**
     * @notice Internal function to remove a session from the active sessions array
     * @param dAppId ID of the dApp
     * @param sessionId ID of the session to remove
     */
    function _removeFromActiveSessions(uint256 dAppId, uint256 sessionId) private {
        uint256[] storage activeSessions = dAppActiveSessions[dAppId];
        uint256 length = activeSessions.length;

        for (uint256 i = 0; i < length; i++) {
            if (activeSessions[i] == sessionId) {
                // Move the last element to this position and pop
                activeSessions[i] = activeSessions[length - 1];
                activeSessions.pop();
                break;
            }
        }
    }
}
