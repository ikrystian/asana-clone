import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  mentions: z.array(z.string()).optional(),
});

// Get all comments for a task
export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;

    // Check if task exists and user has access
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

    // Get comments
    const comments = await prisma.comment.findMany({
      where: {
        taskId,
      },
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
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new comment
export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { content, mentions } = commentSchema.parse(body);

    // Check if task exists and user has access
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
        assignee: true,
        creator: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        task: {
          connect: {
            id: taskId,
          },
        },
        author: {
          connect: {
            id: session.user.id,
          },
        },
        mentions: mentions?.length
          ? {
              create: mentions.map((userId) => ({
                user: {
                  connect: {
                    id: userId,
                  },
                },
              })),
            }
          : undefined,
      },
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
    });

    // Create notification for task assignee if different from commenter
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_ADDED',
          content: `New comment on task "${task.title}"`,
          recipientId: task.assigneeId,
          relatedItemId: taskId,
          relatedItemType: 'task',
        },
      });
    }

    // Create notification for task creator if different from commenter and assignee
    if (task.creatorId !== session.user.id && task.creatorId !== task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_ADDED',
          content: `New comment on task "${task.title}"`,
          recipientId: task.creatorId,
          relatedItemId: taskId,
          relatedItemType: 'task',
        },
      });
    }

    // Create notifications for mentions
    if (mentions?.length) {
      await Promise.all(
        mentions.map(async (userId) => {
          if (userId !== session.user.id) {
            await prisma.notification.create({
              data: {
                type: 'MENTIONED',
                content: `You were mentioned in a comment on task "${task.title}"`,
                recipientId: userId,
                relatedItemId: taskId,
                relatedItemType: 'task',
              },
            });
          }
        })
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
