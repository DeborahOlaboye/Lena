import React from 'react';

/**
 * Parses raw event data from the blockchain into a more usable format
 * @param eventData Raw event data string from the blockchain
 * @returns Parsed event data object
 */
export function parseEventData(eventData: string): Record<string, any> {
  try {
    // Try to parse as JSON first
    if (eventData.startsWith('{') || eventData.startsWith('[')) {
      return JSON.parse(eventData);
    }
    
    // Handle simple key=value format
    if (eventData.includes('=')) {
      return eventData.split(',').reduce((acc: Record<string, string>, pair) => {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
    }
    
    // Return as is if no parsing is possible
    return { raw: eventData };
  } catch (error) {
    console.error('Error parsing event data:', error);
    return { raw: eventData, error: 'Failed to parse event data' };
  }
}

/**
 * Formats an event type into a human-readable string
 * @param eventType The raw event type from the blockchain
 * @returns Formatted event type string
 */
export function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets the appropriate icon name for an event type
 * @param eventType The event type
 * @returns Icon name from Lucide React
 */
export function getEventIconName(eventType: string): string {
  const type = eventType.toLowerCase();
  
  if (type.includes('swap')) return 'RefreshCw';
  if (type.includes('transfer') || type.includes('send')) return 'Send';
  if (type.includes('approve') || type.includes('permission')) return 'CheckCircle';
  if (type.includes('deposit') || type.includes('withdraw')) return 'ArrowDownCircle';
  
  return 'Zap';
}

/**
 * Gets the appropriate color class for an event type
 * @param eventType The event type
 * @returns Tailwind CSS class for the event type
 */
export function getEventColorClass(eventType: string): string {
  const type = eventType.toLowerCase();
  
  if (type.includes('swap')) return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
  if (type.includes('transfer') || type.includes('send')) return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
  if (type.includes('approve') || type.includes('permission')) return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
  if (type.includes('deposit') || type.includes('withdraw')) return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
  
  return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}
