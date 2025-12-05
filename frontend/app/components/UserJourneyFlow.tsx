"use client";

import React from 'react';
import { Node, Edge } from 'reactflow';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import { AnalyticsEvent } from '../types';

interface UserJourneyFlowProps {
  events: AnalyticsEvent[];
}

export function UserJourneyFlow({ events }: UserJourneyFlowProps) {
  if (events.length === 0) return null;

  // Process events into nodes and edges
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeTypes = new Map<string, number>();
  const nodePositions = new Map<string, { x: number; y: number }>();

  events.forEach((event, index) => {
    const nodeId = `${event.eventType}-${index}`;
    const eventType = event.eventType.replace(/_/g, ' ');
    
    // Count occurrences of this event type
    const count = (nodeTypes.get(eventType) || 0) + 1;
    nodeTypes.set(eventType, count);

    // Position nodes in a timeline
    const x = 100 + (index * 200);
    const y = (count - 1) * 100;
    
    nodes.push({
      id: nodeId,
      data: { 
        label: (
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="font-medium text-sm">{eventType}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(Number(event.timestamp) * 1000).toLocaleTimeString()}
            </div>
          </div>
        )
      },
      position: { x, y },
      style: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '0.5rem',
        width: '180px',
      },
    });

    // Create edges between consecutive events
    if (index > 0) {
      edges.push({
        id: `e${index - 1}-${index}`,
        source: `${events[index - 1].eventType}-${index - 1}`,
        target: nodeId,
        animated: true,
        style: { stroke: '#888' },
      });
    }
  });

  return (
    <div className="h-[500px] w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        panOnDrag={[1, 2]} // Only allow pan with left/middle mouse button
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      />
    </div>
  );
}
