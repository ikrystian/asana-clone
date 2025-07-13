import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  sectionId: z.string().optional(),
  assignedUserIds: z.array(z.string().uuid()).optional(),
  parentTaskId: z.string().optional().nullable(),
});

// Get all tasks for a project
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or you do not have access' }, { status: 404 });
    }

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentTaskId: null, // Only get top-level tasks
      },
      include: {
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        section: true,
        subtasks: {
          include: {
            assignedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: [
        {
          section: {
            order: 'asc',
          },
        },
        {
          order: 'asc',
        },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new task
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { title, description, status, priority, dueDate, sectionId, assignedUserIds, parentTaskId } = taskSchema.parse(body);

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or you do not have access' }, { status: 404 });
    }

    // If sectionId is not provided, get the first section
    let taskSectionId = sectionId;
    if (!taskSectionId) {
      const firstSection = await prisma.section.findFirst({
        where: {
          projectId,
        },
        orderBy: {
          order: 'asc',
        },
      });

      if (firstSection) {
        taskSectionId = firstSection.id;
      }
    }

    // Get the highest order in the section
    const highestOrderTask = await prisma.task.findFirst({
      where: {
        projectId,
        sectionId: taskSectionId,
        parentTaskId: null,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        order: newOrder,
        project: {
          connect: {
            id: projectId,
          },
        },
        section: taskSectionId
          ? {
              connect: {
                id: taskSectionId,
              },
            }
          : undefined,
        creator: {
          connect: {
            id: session.user.id,
          },
        },
        parentTask: parentTaskId
          ? {
              connect: {
                id: parentTaskId,
              },
            }
          : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        section: true,
      },
    });

    // Create task assignments
    if (assignedUserIds && assignedUserIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: assignedUserIds.map((userId) => ({
          taskId: task.id,
          userId,
        })),
      });

      // Create notifications for assigned users
      for (const userId of assignedUserIds) {
        if (userId !== session.user.id) {
          await prisma.notification.create({
            data: {
              type: 'TASK_ASSIGNED',
              content: `You were assigned to "${task.title}"`,
              recipientId: userId,
              relatedItemId: task.id,
              relatedItemType: 'task',
            },
          });
        }
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
