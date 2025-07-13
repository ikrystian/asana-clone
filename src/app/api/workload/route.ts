import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { addDays } from 'date-fns';

// Get workload data for team members
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const weekParam = url.searchParams.get('week');

    // Set date range (default to current week)
    const today = weekParam ? new Date(weekParam) : new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    const end = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday
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

    // Get team members from user's projects
    const teamMembers = await prisma.user.findMany({
      where: {
        OR: [
          // Include the current user
          { id: session.user.id },
          // Include project owners
          {
            ownedProjects: {
              some: {
                id: { in: projectIds },
              },
            },
          },
          // Include project members through ProjectMember relation
          {
            memberProjects: {
              some: {
                projectId: { in: projectIds },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      distinct: ['id'],
    });

    // Get tasks for each team member
    const workloads = await Promise.all(
      teamMembers.map(async (user) => {
        // Get all tasks assigned to this user
        const tasks = await prisma.task.findMany({
          where: {
            assignedUsers: {
              some: {
                userId: user.id,
              },
            },
            project: {
              id: { in: projectIds },
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        });

        // Calculate statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'DONE').length;
        const overdueTasks = tasks.filter(task =>
          task.status !== 'DONE' &&
          task.dueDate &&
          new Date(task.dueDate) < new Date()
        ).length;
        const upcomingTasks = tasks.filter(task =>
          task.status !== 'DONE' &&
          task.dueDate &&
          new Date(task.dueDate) > new Date() &&
          new Date(task.dueDate) < addDays(new Date(), 7)
        ).length;

        return {
          user,
          tasks,
          totalTasks,
          completedTasks,
          overdueTasks,
          upcomingTasks,
        };
      })
    );

    return NextResponse.json(workloads);
  } catch (error) {
    console.error('Error fetching workload data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
