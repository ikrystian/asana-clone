import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

// Get team members
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
        // Get projects for each user
        ownedProjects: {
          where: {
            id: { in: projectIds },
          },
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        memberProjects: {
          where: {
            projectId: { in: projectIds },
          },
          select: {
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      distinct: ['id'],
    });

    // Get task statistics for each user
    const teamMembersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        // Get all tasks assigned to this user
        const assignedTasks = await prisma.task.count({
          where: {
            assigneeId: member.id,
            project: {
              id: { in: projectIds },
            },
          },
        });

        // Get completed tasks
        const completedTasks = await prisma.task.count({
          where: {
            assigneeId: member.id,
            status: 'DONE',
            project: {
              id: { in: projectIds },
            },
          },
        });

        // Combine owned projects and member projects
        const memberProjects = member.memberProjects.map(mp => mp.project);
        const allProjects = [...member.ownedProjects, ...memberProjects];
        
        // Remove duplicates
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex((p) => p.id === project.id)
        );

        // Add mock department and role data (in a real app, this would come from the database)
        const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Operations'];
        const roles = ['Developer', 'Designer', 'Product Manager', 'Marketing Specialist', 'Team Lead'];
        
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          image: member.image,
          department: departments[Math.floor(Math.random() * departments.length)],
          role: roles[Math.floor(Math.random() * roles.length)],
          projects: uniqueProjects,
          assignedTasks,
          completedTasks,
        };
      })
    );

    return NextResponse.json(teamMembersWithStats);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
