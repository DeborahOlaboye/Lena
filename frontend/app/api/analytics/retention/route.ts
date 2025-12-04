import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate') || '');
    const endDate = new Date(searchParams.get('endDate') || '');
    const cohortSize = searchParams.get('cohortSize') || 'day';

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get all users who performed any action in the date range
    const usersPipeline = [
      {
        $match: {
          timestamp: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString(),
          },
        },
      },
      {
        $group: {
          _id: '$userId',
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
        },
      },
    ];

    const users = await db
      .collection('analytics_events')
      .aggregate(usersPipeline)
      .toArray();

    // Calculate retention metrics
    const retentionData = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let day = 0; day <= days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const retainedUsers = users.filter(user => {
        const userFirstSeen = new Date(user.firstSeen);
        const userLastSeen = new Date(user.lastSeen);
        
        // Check if user was active on this day after their first seen date
        return (
          userFirstSeen <= currentDate && 
          userLastSeen >= currentDate
        );
      }).length;

      retentionData.push({
        day,
        retained: retainedUsers,
        percentage: users.length > 0 ? (retainedUsers / users.length) * 100 : 0,
      });
    }

    return NextResponse.json(retentionData);
  } catch (error) {
    console.error('Error calculating retention:', error);
    return NextResponse.json(
      { error: 'Failed to calculate retention' },
      { status: 500 }
    );
  }
}
