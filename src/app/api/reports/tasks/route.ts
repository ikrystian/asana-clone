import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { startOfWeek, endOfWeek, subDays, format, eachDayOfInterval } from 'date-fns';

// Get task statistics for reports
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || 'week';

    // Get projects the user has access to
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
          { isPublic: true },
        ],
      },
      select: {
        id: true,
      },
    });

    const projectIds = projects.map(project => project.id);

    // Calculate date range based on selected time range
    const today = new Date();
    let startDate, endDate;

    if (timeRange === 'week') {
      startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      endDate = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday
    } else if (timeRange === 'month') {
      startDate = subDays(today, 30);
      endDate = today;
    } else {
      startDate = subDays(today, 90);
      endDate = today;
    }

    // Get all tasks in the projects
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          id: { in: projectIds },
        },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Calculate status distribution
    const statusCounts = {
      'TODO': 0,
      'IN_PROGRESS': 0,
      'REVIEW': 0,
      'DONE': 0,
    };

    tasks.forEach(task => {
      if (statusCounts[task.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[task.status as keyof typeof statusCounts]++;
      }
    });

    const statusDistribution = [
      { name: 'To Do', value: statusCounts['TODO'], color: '#94a3b8' },
      { name: 'In Progress', value: statusCounts['IN_PROGRESS'], color: '#3b82f6' },
      { name: 'Review', value: statusCounts['REVIEW'], color: '#eab308' },
      { name: 'Done', value: statusCounts['DONE'], color: '#22c55e' },
    ];

    // Calculate priority distribution
    const priorityCounts = {
      'LOW': 0,
      'MEDIUM': 0,
      'HIGH': 0,
      'URGENT': 0,
    };

    tasks.forEach(task => {
      if (priorityCounts[task.priority as keyof typeof priorityCounts] !== undefined) {
        priorityCounts[task.priority as keyof typeof priorityCounts]++;
      }
    });

    const priorityDistribution = [
      { name: 'Low', value: priorityCounts['LOW'], color: '#3b82f6' },
      { name: 'Medium', value: priorityCounts['MEDIUM'], color: '#22c55e' },
      { name: 'High', value: priorityCounts['HIGH'], color: '#f97316' },
      { name: 'Urgent', value: priorityCounts['URGENT'], color: '#ef4444' },
    ];

    // Calculate time statistics
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const timeStats = dateRange.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const tasksCreated = tasks.filter(task => 
        format(new Date(task.createdAt), 'yyyy-MM-dd') === formattedDate
      ).length;
      
      const tasksCompleted = tasks.filter(task => 
        task.completedAt && format(new Date(task.completedAt), 'yyyy-MM-dd') === formattedDate
      ).length;

      return {
        date: format(date, 'MMM dd'),
        tasksCreated,
        tasksCompleted,
      };
    });

    return NextResponse.json({
      statusDistribution,
      priorityDistribution,
      timeStats,
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
