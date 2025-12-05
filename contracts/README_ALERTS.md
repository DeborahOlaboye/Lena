# Smart Alerts System

This document provides an overview of the Smart Alerts System implemented for monitoring and alerting on unusual on-chain activity.

## Overview

The Smart Alerts System monitors on-chain activity and triggers alerts when certain thresholds are exceeded, such as high gas usage or high transaction failure rates. The system consists of two main components:

1. **AlertManager**: A smart contract that manages alert configurations and triggers alerts.
2. **MetricsAggregator Integration**: Updates to the existing MetricsAggregator to work with the AlertManager.

## Features

- **Configurable Alerts**: Set custom thresholds for gas usage and failure rates.
- **Real-time Monitoring**: Alerts are triggered in real-time as transactions are processed.
- **Flexible Alerting**: Support for different types of alerts with customizable conditions.
- **Role-based Access Control**: Only authorized addresses can configure alerts.

## Smart Contracts

### AlertManager.sol

Manages alert configurations and triggers alerts when thresholds are exceeded.

#### Key Functions

- `checkForAlerts(dAppId, date, gasUsed, success)`: Called by MetricsAggregator to check for alerts.
- `setAlertConfig(dAppId, gasThreshold, failureRateThreshold, minTransactions, isActive)`: Configure alerts for a dApp.
- `setAlerter(alerter, isActive)`: Add or remove an alerter address.

### MetricsAggregator.sol (Updated)

Updated to integrate with the AlertManager and trigger alert checks.

#### Key Updates

- Added `alertManager` state variable and `setAlertManager` function.
- Modified transaction processing to call `AlertManager.checkForAlerts`.
- Added `AlertManagerUpdated` event.

## Deployment

1. Deploy the `AlertManager` contract, passing the `MetricsAggregator` address to the constructor.
2. Call `setAlertManager` on the `MetricsAggregator` contract to set the `AlertManager` address.
3. Configure alert thresholds using `setAlertConfig` on the `AlertManager` contract.

## Usage

### Setting Up Alerts

1. Deploy the `AlertManager` contract.
2. Set the `AlertManager` address in `MetricsAggregator`.
3. Configure alerts for each dApp using `setAlertConfig`.

### Monitoring Alerts

Listen for the `AlertTriggered` event from the `AlertManager` contract to be notified of alerts.

## Events

### AlertManager Events

- `AlertTriggered(dAppId, alertType, value, threshold, timestamp, blockNumber)`: Emitted when an alert is triggered.
- `AlertConfigUpdated(dAppId, gasThreshold, failureRateThreshold, minTransactions, isActive)`: Emitted when alert configuration is updated.
- `AlerterUpdated(alerter, isActive)`: Emitted when an alerter is added or removed.

## Security Considerations

- Only authorized addresses should be able to configure alerts.
- Set appropriate gas limits for alert checks to prevent out-of-gas errors.
- Monitor the system for false positives/negatives and adjust thresholds accordingly.

## Future Improvements

- Add more alert types (e.g., volume spikes, unusual transaction patterns).
- Implement a notification system (e.g., email, SMS, webhook) for alerts.
- Add support for complex alert conditions using logical operators.
- Implement rate limiting for alerts to prevent spam.
