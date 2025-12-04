import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate') || '');
    const endDate = new Date(searchParams.get('endDate') || '');
    const metric = searchParams.get('metric');
    const groupBy = searchParams.get('groupBy');

    // Basic validation
    if (!metric || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Build the aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          'properties.metric': metric,
          timestamp: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString(),
          },
        },
      },
    ];

    // Add grouping if specified
    if (groupBy) {
      pipeline.push({
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : 
                     groupBy === 'hour' ? '%Y-%m-%dT%H:00:00.000Z' :
                     '%Y-%m-01T00:00:00.000Z', // Default to month
              date: { $toDate: '$timestamp' },
            },
          },
          count: { $sum: 1 },
        },
      });
    } else {
      // If no grouping, just count all matching documents
      pipeline.push({
        $count: 'total',
      });
    }

    const result = await db
      .collection('analytics_events')
      .aggregate(pipeline)
      .toArray();

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching aggregated data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
