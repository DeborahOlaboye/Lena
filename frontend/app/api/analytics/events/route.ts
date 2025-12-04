import { NextResponse } from 'next/server';
import { AnalyticsEvent } from '@/types/analytics';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const event: AnalyticsEvent = await request.json();
    
    // Basic validation
    if (!event.name || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Store the event in MongoDB
    await db.collection('analytics_events').insertOne({
      ...event,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing analytics event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
