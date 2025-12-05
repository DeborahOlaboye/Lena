"use client";

import { AnalyticsEvent } from '../types';
import { formatEventType, getEventColorClass, getEventIconName } from '../lib/eventUtils';
import { formatTimeAgo } from '../lib/utils';
import { Clock, ArrowRight, Zap, Search, Settings, Wallet, RefreshCw, Send, CheckCircle, ArrowDownCircle } from 'lucide-react';

const EventIcon = ({ eventType }: { eventType: string }) => {
  const iconName = getEventIconName(eventType);
  const colorClass = getEventColorClass(eventType).split(' ')[0].replace('bg-', 'text-');
  
  const icons: Record<string, React.ReactNode> = {
    RefreshCw: <RefreshCw className={`h-4 w-4 ${colorClass}`} />,
    Send: <Send className={`h-4 w-4 ${colorClass}`} />,
    CheckCircle: <CheckCircle className={`h-4 w-4 ${colorClass}`} />,
    ArrowDownCircle: <ArrowDownCircle className={`h-4 w-4 ${colorClass}`} />,
    Zap: <Zap className={`h-4 w-4 ${colorClass}`} />
  };
  
  return icons[iconName] || <Zap className={`h-4 w-4 ${colorClass}`} />;
};

export function EnhancedTimeline({ events }: { events: AnalyticsEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-700" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No events found for this user
        </p>
      </div>
    );
  }

  // Group events by day
  const eventsByDay = events.reduce((acc, event) => {
    const date = new Date(Number(event.timestamp) * 1000);
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, AnalyticsEvent[]>);

  return (
    <div className="space-y-8">
      {Object.entries(eventsByDay).map(([date, dayEvents]) => (
        <div key={date} className="relative">
          <div className="sticky top-0 z-10 mb-4 flex items-center bg-white/80 py-2 backdrop-blur-sm dark:bg-gray-900/80">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <span className="mx-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              {date}
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <div className="relative">
            <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="space-y-6">
              {dayEvents.map((event, index) => {
                const eventType = event.eventType
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                return (
                  <div key={`${event.eventId}-${index}`} className="relative flex gap-4">
                    <div className="absolute left-6 -ml-0.5 mt-6 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-900"></div>
                    
                    <div className="flex-1 pl-10">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventColorClass(event.eventType)}`}>
                          <EventIcon eventType={event.eventType} />
                          {formatEventType(event.eventType)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(Number(event.timestamp) * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Block</p>
                            <p className="font-mono text-sm">#{event.blockNumber.toString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Transaction</p>
                            <p className="font-mono text-sm truncate">0x{event.eventId.toString(16)}</p>
                          </div>
                        </div>
                        
                        {event.eventData && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Event Data</p>
                            <pre className="overflow-x-auto rounded bg-white p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              {event.eventData}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
