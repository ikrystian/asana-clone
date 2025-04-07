import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  sectionId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  order: z.number().optional(),
});

// Get a specific task
export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;

    // Get task with project access check
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
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
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            ownerId: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            mentions: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: true,
        customFieldValues: {
          include: {
            field: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a task
export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;
    const body = await req.json();
    const { title, description, status, priority, dueDate, sectionId, assigneeId, order } = taskUpdateSchema.parse(body);

    // Get task with project access check
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
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
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    // Check if status is changing to DONE
    const isCompletingTask = status === 'DONE' && task.status !== 'DONE';

    // Update task
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedAt: isCompletingTask ? new Date() : (status !== 'DONE' ? null : task.completedAt),
        sectionId,
        assigneeId,
        order,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
      },
    });

    // Create notifications for status changes
    if (isCompletingTask && task.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_COMPLETED',
          content: `Task "${updatedTask.title}" was completed`,
          recipientId: task.creatorId,
          relatedItemId: taskId,
          relatedItemType: 'task',
        },
      });
    }

    // Create notification for assignment changes
    if (
      assigneeId &&
      assigneeId !== task.assigneeId &&
      assigneeId !== session.user.id
    ) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          content: `You were assigned to "${updatedTask.title}"`,
          recipientId: assigneeId,
          relatedItemId: taskId,
          relatedItemType: 'task',
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;

    // Get task with project access check
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: session.user.id },
          {
            project: {
              OR: [
                { ownerId: session.user.id },
                {
                  members: {
                    some: {
                      userId: session.user.id,
                      role: { in: ['OWNER', 'ADMIN'] },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Delete task
    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
