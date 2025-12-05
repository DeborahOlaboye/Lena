'use client';

import { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { LoadingSpinner, InlineLoading } from '@/app/components/ui/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/Alert';
import { Button } from '@/app/components/ui/Button';
import useWebSocket from '../hooks/useWebSocket';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type MetricData = {
  timestamp: number;
  value: number;
};

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';

export function RealTimeMetricsWithWebSocket() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWebSocketMessage = useCallback((data: any) => {
    try {
      // Process the incoming WebSocket message
      // This assumes the server sends data in the format: { timestamp: number, value: number }
      const newMetric: MetricData = {
        timestamp: data.timestamp || Date.now(),
        value: data.value || 0,
      };
      
      setMetrics(prev => {
        // Keep only the last 100 data points for performance
        const updated = [...prev, newMetric].slice(-100);
        return updated;
      });
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
      setError('Failed to process incoming data');
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
    setError(error.message || 'Connection error');
  }, []);

  const handleConnect = useCallback(() => {
    console.log('WebSocket connected');
    setError(null);
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
  }, []);

  // Initialize WebSocket connection
  const {
    state: connectionState,
    reconnect,
    isConnected,
    isConnecting,
  } = useWebSocket({
    url: WEBSOCKET_URL,
    onMessage: handleWebSocketMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
  });

  // Process metrics for chart
  const processChartData = () => {
    if (metrics.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Metrics',
          data: [],
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }],
      };
    }

    return {
      labels: metrics.map((m) => new Date(m.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'Metrics',
          data: metrics.map((m) => m.value),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeInOutQuad' as const,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
  };

  // Show loading state if we're still connecting and have no data
  if (isConnecting && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Connecting to real-time data...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error}</p>
          <Button onClick={reconnect} size="sm">
            Reconnect
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show empty state if no data is available yet
  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center p-4 border border-dashed rounded-lg">
        <p className="text-gray-500">Waiting for real-time data...</p>
        <InlineLoading text="Connecting to data stream" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Real-time Metrics</h3>
        <div className="flex items-center space-x-2">
          {!isConnected && (
            <div className="flex items-center space-x-1 text-sm text-yellow-600">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
              <span>Reconnecting...</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={reconnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      <div className="relative h-80 w-full">
        <Line data={processChartData()} options={chartOptions} />
      </div>
      
      <div className="text-xs text-gray-500 flex justify-between">
        <span>{metrics.length} data points</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
