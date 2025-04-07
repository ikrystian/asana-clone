import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

// Get user statistics for reports
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get team members from user's projects
    const teamMembers = await prisma.user.findMany({
      where: {
        OR: [
          // Include project owners
          {
            ownedProjects: {
              some: {
                id: { in: projectIds },
              },
            },
          },
          // Include project members
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

    // Get task statistics for each user
    const userStats = await Promise.all(
      teamMembers.map(async (user) => {
        // Get all tasks assigned to this user
        const assignedTasks = await prisma.task.findMany({
          where: {
            assigneeId: user.id,
            project: {
              id: { in: projectIds },
            },
          },
          select: {
            id: true,
            status: true,
            dueDate: true,
            priority: true,
          },
        });

        const totalTasks = assignedTasks.length;
        const completedTasks = assignedTasks.filter(task => task.status === 'DONE').length;
        const overdueTasks = assignedTasks.filter(task => 
          task.status !== 'DONE' && 
          task.dueDate && 
          new Date(task.dueDate) < new Date()
        ).length;
        const highPriorityTasks = assignedTasks.filter(task => 
          task.priority === 'HIGH' || task.priority === 'URGENT'
        ).length;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          totalTasks,
          completedTasks,
          overdueTasks,
          highPriorityTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
      })
    );

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
