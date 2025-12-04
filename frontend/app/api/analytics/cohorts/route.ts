import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
  periods: string[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate') || '');
    const endDate = new Date(searchParams.get('endDate') || '');
    const period = searchParams.get('period') || 'week';
    const cohortSize = searchParams.get('cohortSize') || 'week';

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Function to format date based on period
    const formatDate = (date: Date, size: 'day' | 'week' | 'month' = 'week'): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (size) {
        case 'day':
          return `${year}-${month}-${day}`;
        case 'week': {
          // Get week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          return `${year}-W${String(weekNumber).padStart(2, '0')}`;
        }
        case 'month':
        default:
          return `${year}-${month}`;
      }
    };

    // Get all users grouped by cohort
    const usersByCohort = await db.collection('analytics_events').aggregate([
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
          events: {
            $push: {
              name: '$name',
              timestamp: '$timestamp',
            },
          },
        },
      },
      {
        $project: {
          cohort: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$firstSeen' } } },
          firstSeen: 1,
          events: 1,
        },
      },
      {
        $group: {
          _id: '$cohort',
          users: { $push: '$$ROOT' },
          size: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).toArray();

    // Calculate retention for each cohort
    const cohorts: CohortData[] = [];
    const allPeriods: Set<string> = new Set();

    for (const cohort of usersByCohort) {
      const cohortDate = new Date(cohort._id);
      const cohortData: CohortData = {
        cohort: formatDate(cohortDate, cohortSize as 'day' | 'week' | 'month'),
        size: cohort.size,
        retention: [],
        periods: [],
      };

      // Calculate retention for each period
      let currentDate = new Date(cohortDate);
      let periodIndex = 0;

      while (currentDate <= endDate) {
        const periodEnd = new Date(currentDate);
        
        // Set period end based on period type
        if (period === 'day') {
          periodEnd.setDate(periodEnd.getDate() + 1);
        } else if (period === 'week') {
          periodEnd.setDate(periodEnd.getDate() + 7);
        } else {
          // month
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Count users active in this period
        const activeUsers = cohort.users.filter((user: any) => {
          return user.events.some((event: any) => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= currentDate && eventDate < periodEnd;
          });
        }).length;

        const retention = cohort.size > 0 ? (activeUsers / cohort.size) * 100 : 0;
        cohortData.retention.push(parseFloat(retention.toFixed(2)));
        
        // Track the period
        const periodLabel = formatDate(currentDate, period as 'day' | 'week' | 'month');
        cohortData.periods.push(periodLabel);
        allPeriods.add(periodLabel);

        // Move to next period
        currentDate = periodEnd;
        periodIndex++;
      }

      cohorts.push(cohortData);
    }

    // Ensure all cohorts have the same number of periods
    const maxPeriods = Math.max(...cohorts.map(c => c.retention.length));
    for (const cohort of cohorts) {
      while (cohort.retention.length < maxPeriods) {
        cohort.retention.push(0);
        // Add a placeholder period if needed
        if (cohort.periods.length < maxPeriods) {
          const lastPeriod = cohort.periods[cohort.periods.length - 1] || '';
          // Try to increment the period (simplified)
          cohort.periods.push(`${lastPeriod}+`);
        }
      }
    }

    return NextResponse.json(cohorts);
  } catch (error) {
    console.error('Error analyzing cohorts:', error);
    return NextResponse.json(
      { error: 'Failed to analyze cohorts' },
      { status: 500 }
    );
  }
}
