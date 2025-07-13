import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const assignUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Assign a user to a task
export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;
    const body = await req.json();
    const { userId } = assignUserSchema.parse(body);

    // Check if task exists and user has access to the project
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
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    // Check if the user to be assigned exists
    const userToAssign = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userToAssign) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user is already assigned to this task
    const existingAssignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId,
        userId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json({ error: 'User is already assigned to this task' }, { status: 409 });
    }

    // Assign the user to the task
    const taskAssignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        userId,
      },
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
    });

    // Create notification for assignment
    if (userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          content: `You were assigned to task "${task.title}"`,
          recipientId: userId,
          relatedItemId: taskId,
          relatedItemType: 'task',
        },
      });
    }

    return NextResponse.json(taskAssignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error assigning user to task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unassign a user from a task
export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if task exists and user has access to the project
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
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    // Check if the assignment exists
    const existingAssignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId,
        userId,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: 'User is not assigned to this task' }, { status: 404 });
    }

    // Remove the task assignment
    await prisma.taskAssignment.delete({
      where: {
        id: existingAssignment.id,
      },
    });

    return NextResponse.json({ message: 'User unassigned from task successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error unassigning user from task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all assigned users for a task
export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    // Check if task exists and user has access to the project
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
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    const assignedUsers = await prisma.taskAssignment.findMany({
      where: {
        taskId,
      },
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
    });

    return NextResponse.json(assignedUsers);
  } catch (error) {
    console.error('Error fetching assigned users for task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
