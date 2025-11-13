// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./EventLogger.sol";

/**
 * @title SimpleSwap
 * @notice Demo DEX with constant product AMM formula (x * y = k)
 * @dev Integrates with EventLogger for automatic analytics logging
 */
contract SimpleSwap {
    // Token reserves
    uint256 public reserveA;
    uint256 public reserveB;

    // Liquidity provider shares
    mapping(address => uint256) public liquidityShares;
    uint256 public totalLiquidity;

    // Reference to EventLogger for analytics
    EventLogger public immutable eventLogger;

    // DApp ID in the analytics registry
    uint256 public immutable dAppId;

    // Swap fee (0.3% = 30 basis points)
    uint256 public constant FEE_PERCENT = 30; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        uint256 timestamp
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        uint256 timestamp
    );

    event Swap(
        address indexed user,
        bool aToB,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );

    // Custom errors
    error InsufficientLiquidity();
    error InsufficientAmount();
    error InsufficientShares();
    error SlippageExceeded();
    error InvalidAmounts();

    /**
     * @notice Constructor to set EventLogger and dApp ID
     * @param _eventLogger Address of the EventLogger contract
     * @param _dAppId ID of this dApp in the analytics registry
     */
    constructor(address _eventLogger, uint256 _dAppId) {
        require(_eventLogger != address(0), "Invalid EventLogger address");
        eventLogger = EventLogger(_eventLogger);
        dAppId = _dAppId;
    }

    /**
     * @notice Add liquidity to the pool
     * @param amountA Amount of token A to add
     * @param amountB Amount of token B to add
     * @return liquidity Amount of liquidity shares minted
     */
    function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 liquidity) {
        if (amountA == 0 || amountB == 0) {
            revert InvalidAmounts();
        }

        // For first liquidity provider, set initial ratio
        if (totalLiquidity == 0) {
            liquidity = sqrt(amountA * amountB);
            require(liquidity > 0, "Insufficient liquidity minted");
        } else {
            // Maintain current ratio
            uint256 liquidityA = (amountA * totalLiquidity) / reserveA;
            uint256 liquidityB = (amountB * totalLiquidity) / reserveB;

            // Use the smaller amount to maintain ratio
            liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;

            if (liquidity == 0) {
                revert InsufficientAmount();
            }
        }

        // Update reserves and shares
        reserveA += amountA;
        reserveB += amountB;
        liquidityShares[msg.sender] += liquidity;
        totalLiquidity += liquidity;

        // Log to analytics
        eventLogger.logEvent(
            dAppId,
            msg.sender,
            "liquidity_added",
            string(abi.encodePacked(
                '{"amountA":', uint2str(amountA),
                ',"amountB":', uint2str(amountB),
                ',"liquidity":', uint2str(liquidity), '}'
            ))
        );

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity, block.timestamp);

        return liquidity;
    }

    /**
     * @notice Remove liquidity from the pool
     * @param liquidity Amount of liquidity shares to burn
     * @return amountA Amount of token A returned
     * @return amountB Amount of token B returned
     */
    function removeLiquidity(uint256 liquidity) external returns (uint256 amountA, uint256 amountB) {
        if (liquidity == 0) {
            revert InsufficientAmount();
        }
        if (liquidityShares[msg.sender] < liquidity) {
            revert InsufficientShares();
        }
        if (totalLiquidity == 0) {
            revert InsufficientLiquidity();
        }

        // Calculate amounts to return
        amountA = (liquidity * reserveA) / totalLiquidity;
        amountB = (liquidity * reserveB) / totalLiquidity;

        if (amountA == 0 || amountB == 0) {
            revert InsufficientAmount();
        }

        // Update reserves and shares
        reserveA -= amountA;
        reserveB -= amountB;
        liquidityShares[msg.sender] -= liquidity;
        totalLiquidity -= liquidity;

        // Log to analytics
        eventLogger.logEvent(
            dAppId,
            msg.sender,
            "liquidity_removed",
            string(abi.encodePacked(
                '{"amountA":', uint2str(amountA),
                ',"amountB":', uint2str(amountB),
                ',"liquidity":', uint2str(liquidity), '}'
            ))
        );

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity, block.timestamp);

        return (amountA, amountB);
    }

    /**
     * @notice Swap tokens using constant product formula
     * @param aToB True to swap A for B, false to swap B for A
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum amount of output tokens (slippage protection)
     * @return amountOut Amount of output tokens received
     */
    function swap(
        bool aToB,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        if (amountIn == 0) {
            revert InsufficientAmount();
        }
        if (reserveA == 0 || reserveB == 0) {
            revert InsufficientLiquidity();
        }

        // Calculate amount out using constant product formula with fee
        amountOut = getAmountOut(amountIn, aToB);

        if (amountOut < minAmountOut) {
            revert SlippageExceeded();
        }

        // Update reserves
        if (aToB) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        // Log to analytics
        eventLogger.logEvent(
            dAppId,
            msg.sender,
            "swap",
            string(abi.encodePacked(
                '{"direction":"', aToB ? "AtoB" : "BtoA",
                '","amountIn":', uint2str(amountIn),
                ',"amountOut":', uint2str(amountOut), '}'
            ))
        );

        emit Swap(msg.sender, aToB, amountIn, amountOut, block.timestamp);

        return amountOut;
    }

    /**
     * @notice Calculate output amount for a given input using constant product formula
     * @param amountIn Amount of input tokens
     * @param aToB True for A to B swap, false for B to A
     * @return amountOut Amount of output tokens (including 0.3% fee)
     */
    function getAmountOut(uint256 amountIn, bool aToB) public view returns (uint256 amountOut) {
        if (reserveA == 0 || reserveB == 0) {
            return 0;
        }

        // Apply 0.3% fee to input amount
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENT);

        uint256 reserveIn;
        uint256 reserveOut;

        if (aToB) {
            reserveIn = reserveA;
            reserveOut = reserveB;
        } else {
            reserveIn = reserveB;
            reserveOut = reserveA;
        }

        // Constant product formula: x * y = k
        // amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee)
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;

        amountOut = numerator / denominator;

        return amountOut;
    }

    /**
     * @notice Get current reserves
     * @return _reserveA Reserve of token A
     * @return _reserveB Reserve of token B
     */
    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }

    /**
     * @notice Get liquidity shares for an address
     * @param provider Address of the liquidity provider
     * @return uint256 Amount of liquidity shares
     */
    function getLiquidityShares(address provider) external view returns (uint256) {
        return liquidityShares[provider];
    }

    /**
     * @notice Calculate the current exchange rate (A per B)
     * @return uint256 Price of B in terms of A (scaled by 1e18)
     */
    function getExchangeRate() external view returns (uint256) {
        if (reserveB == 0) {
            return 0;
        }
        return (reserveA * 1e18) / reserveB;
    }

    /**
     * @notice Calculate price impact for a swap
     * @param amountIn Amount of input tokens
     * @param aToB True for A to B swap, false for B to A
     * @return uint256 Price impact in basis points (100 = 1%)
     */
    function getPriceImpact(uint256 amountIn, bool aToB) external view returns (uint256) {
        if (reserveA == 0 || reserveB == 0 || amountIn == 0) {
            return 0;
        }

        uint256 reserveIn = aToB ? reserveA : reserveB;
        uint256 reserveOut = aToB ? reserveB : reserveA;

        // Calculate ideal output without price impact
        uint256 idealOut = (amountIn * reserveOut) / reserveIn;

        // Calculate actual output with price impact
        uint256 actualOut = getAmountOut(amountIn, aToB);

        if (idealOut == 0) {
            return 0;
        }

        // Price impact = (idealOut - actualOut) / idealOut * 10000
        uint256 impact = ((idealOut - actualOut) * 10000) / idealOut;

        return impact;
    }

    /**
     * @notice Square root function for liquidity calculation
     * @param x Input value
     * @return y Square root of x
     */
    function sqrt(uint256 x) private pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @notice Convert uint256 to string
     * @param _i Input number
     * @return _uintAsString String representation
     */
    function uint2str(uint256 _i) private pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
