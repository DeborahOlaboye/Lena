declare module '../lib/eventUtils' {
  export function parseEventData(eventData: string): Record<string, any>;
  export function formatEventType(eventType: string): string;
  export function getEventIconName(eventType: string): string;
  export function getEventColorClass(eventType: string): string;
}
