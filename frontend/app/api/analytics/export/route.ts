import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getToken } from 'next-auth/jwt';
import { NextApiRequest } from 'next';

// In-memory store for export history (in production, use a database)
const exportHistory = new Map<string, any>();

// Retention period: 30 days in milliseconds
const RETENTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

interface ExportRequest {
  startDate: string;
  endDate: string;
  format: 'csv' | 'json';
  type: 'raw' | 'aggregated';
  metrics?: string[];
  groupBy?: string;
  timezone?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getToken({ req: req as unknown as NextApiRequest });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const exportRequest: ExportRequest = await req.json();
    
    // Validate request
    if (!exportRequest.startDate || !exportRequest.endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(exportRequest.startDate);
    const endDate = new Date(exportRequest.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00.000Z)' },
        { status: 400 }
      );
    }

    // Create export record
    const exportId = new ObjectId().toString();
    const exportRecord = {
      _id: exportId,
      userId: session.sub,
      status: 'processing',
      format: exportRequest.format,
      type: exportRequest.type,
      startDate: startDate,
      endDate: endDate,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + RETENTION_PERIOD_MS),
      downloadUrl: '',
      metrics: exportRequest.metrics || [],
      groupBy: exportRequest.groupBy,
    };

    // Store in database (in-memory for this example)
    exportHistory.set(exportId, exportRecord);

    // Process export in the background
    processExport(exportId, exportRequest, session.sub as string);

    return NextResponse.json({
      exportId,
      status: 'processing',
      message: 'Export is being processed. Check the status using the export ID.'
    });

  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get export status or download URL
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exportId = searchParams.get('exportId');
    
    if (!exportId) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }

    const session = await getToken({ req: req as unknown as NextApiRequest });
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get export record (in-memory for this example)
    const exportRecord = exportHistory.get(exportId);
    
    if (!exportRecord) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to access this export
    if (exportRecord.userId !== session.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(exportRecord);

  } catch (error) {
    console.error('Error getting export status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background process to generate export
async function processExport(exportId: string, exportRequest: ExportRequest, userId: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Update status to processing
    const exportRecord = exportHistory.get(exportId);
    if (!exportRecord) return;
    
    exportRecord.status = 'processing';
    exportHistory.set(exportId, exportRecord);

    const startDate = new Date(exportRequest.startDate);
    const endDate = new Date(exportRequest.endDate);

    let data;
    
    if (exportRequest.type === 'raw') {
      // Export raw events
      data = await db.collection('analytics_events')
        .find({
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .toArray();
    } else {
      // Export aggregated data
      // This is a simplified example - in a real app, you would implement proper aggregation
      const pipeline = [
        {
          $match: {
            timestamp: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp',
                timezone: exportRequest.timezone || 'UTC'
              }
            },
            count: { $sum: 1 },
            // Add more metrics as needed
          }
        },
        { $sort: { _id: 1 } }
      ];
      
      data = await db.collection('analytics_events').aggregate(pipeline).toArray();
    }

    // Convert to requested format
    let exportData: string;
    let contentType: string;
    
    if (exportRequest.format === 'csv') {
      exportData = convertToCSV(data);
      contentType = 'text/csv';
    } else {
      exportData = JSON.stringify(data, null, 2);
      contentType = 'application/json';
    }

    // In a real app, you would upload this to a storage service (e.g., S3, GCS)
    // For this example, we'll store it in-memory
    const downloadUrl = `data:${contentType};charset=utf-8,${encodeURIComponent(exportData)}`;
    
    // Update export record
    exportRecord.status = 'completed';
    exportRecord.downloadUrl = downloadUrl;
    exportRecord.completedAt = new Date();
    exportHistory.set(exportId, exportRecord);

  } catch (error) {
    console.error('Error processing export:', error);
    
    // Update export record with error
    const exportRecord = exportHistory.get(exportId);
    if (exportRecord) {
      exportRecord.status = 'failed';
      exportRecord.error = error instanceof Error ? error.message : 'Unknown error';
      exportHistory.set(exportId, exportRecord);
    }
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      const escaped = String(value ?? '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

// Cleanup expired exports (run periodically)
function cleanupExpiredExports() {
  const now = new Date();
  for (const [id, exportRecord] of exportHistory.entries()) {
    if (exportRecord.expiresAt < now) {
      exportHistory.delete(id);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredExports, 60 * 60 * 1000);
