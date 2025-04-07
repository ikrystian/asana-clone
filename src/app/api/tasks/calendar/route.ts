import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

// Get tasks for calendar view (tasks with due dates)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const monthParam = url.searchParams.get('month');
    const yearParam = url.searchParams.get('year');

    // Set date range (default to current month)
    let currentDate = new Date();

    if (monthParam && yearParam) {
      currentDate = new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1);
    }

    // Get start and end of the displayed calendar (including adjacent months)
    const prevMonth = subMonths(currentDate, 1);
    const nextMonth = addMonths(currentDate, 1);

    const start = startOfMonth(prevMonth);
    const end = endOfMonth(nextMonth);

    // Get all tasks with due dates in the range that the user has access to
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: start,
          lte: end,
        },
        OR: [
          // Tasks assigned to the user
          { assigneeId: session.user.id },
          // Tasks created by the user
          { creatorId: session.user.id },
          // Tasks in projects the user has access to
          {
            project: {
              OR: [
                // Projects owned by the user
                { ownerId: session.user.id },
                // Projects where the user is a member
                {
                  members: {
                    some: {
                      userId: session.user.id,
                    },
                  },
                },
                // Public projects
                { isPublic: true },
              ],
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { status: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
