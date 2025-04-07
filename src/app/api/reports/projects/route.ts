import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

// Get project statistics for reports
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
        name: true,
        color: true,
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    // Calculate statistics for each project
    const projectStats = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
      const overdueTasks = project.tasks.filter(task => 
        task.status !== 'DONE' && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length;
      const upcomingTasks = project.tasks.filter(task => 
        task.status !== 'DONE' && 
        task.dueDate && 
        new Date(task.dueDate) > new Date() &&
        new Date(task.dueDate) < new Date(Date.now() + 7 * 86400000) // Next 7 days
      ).length;

      return {
        id: project.id,
        name: project.name,
        color: project.color,
        totalTasks,
        completedTasks,
        overdueTasks,
        upcomingTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    });

    return NextResponse.json(projectStats);
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
