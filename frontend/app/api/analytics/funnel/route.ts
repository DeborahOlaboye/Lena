import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const steps = searchParams.get('steps')?.split(',') || [];
    const startDate = new Date(searchParams.get('startDate') || '');
    const endDate = new Date(searchParams.get('endDate') || '');

    if (steps.length === 0 || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const funnelData = [];
    
    // Get count for each step in the funnel
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // For the first step, just count the unique users
      if (i === 0) {
        const result = await db.collection('analytics_events').aggregate([
          {
            $match: {
              name: step,
              timestamp: {
                $gte: startDate.toISOString(),
                $lte: endDate.toISOString(),
              },
            },
          },
          {
            $group: {
              _id: '$userId',
              count: { $sum: 1 },
              firstSeen: { $min: '$timestamp' },
            },
          },
          {
            $count: 'total',
          },
        ]).toArray();

        funnelData.push({
          name: step,
          count: result[0]?.total || 0,
          percentage: 100, // First step is 100%
        });
      } else {
        // For subsequent steps, count users who completed this step after completing all previous steps
        const previousSteps = steps.slice(0, i);
        
        const result = await db.collection('analytics_events').aggregate([
          {
            $match: {
              $or: [
                { name: step },
                ...previousSteps.map(prevStep => ({ name: prevStep })),
              ],
              timestamp: {
                $gte: startDate.toISOString(),
                $lte: endDate.toISOString(),
              },
            },
          },
          {
            $group: {
              _id: '$userId',
              steps: { $addToSet: '$name' },
            },
          },
          {
            $match: {
              // User must have all previous steps and the current step
              $expr: {
                $and: [
                  { $in: [step, '$steps'] },
                  ...previousSteps.map(prevStep => ({
                    $in: [prevStep, '$steps'],
                  })),
                ],
              },
            },
          },
          {
            $count: 'total',
          },
        ]).toArray();

        const percentage = funnelData[0]?.count > 0
          ? Math.round(((result[0]?.total || 0) / funnelData[0].count) * 100 * 100) / 100
          : 0;

        funnelData.push({
          name: step,
          count: result[0]?.total || 0,
          percentage,
        });
      }
    }

    return NextResponse.json(funnelData);
  } catch (error) {
    console.error('Error analyzing funnel:', error);
    return NextResponse.json(
      { error: 'Failed to analyze funnel' },
      { status: 500 }
    );
  }
}
