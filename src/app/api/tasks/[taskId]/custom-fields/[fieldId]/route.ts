import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const customFieldValueSchema = z.object({
  value: z.string(),
});

// Get a specific custom field value
export async function GET(
  req: Request,
  { params }: { params: { taskId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, fieldId } = await params;

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

    // Get custom field value
    const customFieldValue = await prisma.customFieldValue.findUnique({
      where: {
        taskId_fieldId: {
          taskId,
          fieldId,
        },
      },
      include: {
        field: true,
      },
    });

    if (!customFieldValue) {
      return NextResponse.json({ error: 'Custom field value not found' }, { status: 404 });
    }

    return NextResponse.json(customFieldValue);
  } catch (error) {
    console.error('Error fetching custom field value:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a custom field value
export async function PUT(
  req: Request,
  { params }: { params: { taskId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, fieldId } = await params;
    const body = await req.json();
    const { value } = customFieldValueSchema.parse(body);

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
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have access' }, { status: 404 });
    }

    // Check if custom field exists
    const customField = await prisma.customField.findUnique({
      where: {
        id: fieldId,
      },
    });

    if (!customField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    // Update or create custom field value
    const customFieldValue = await prisma.customFieldValue.upsert({
      where: {
        taskId_fieldId: {
          taskId,
          fieldId,
        },
      },
      update: {
        value,
      },
      create: {
        value,
        task: {
          connect: {
            id: taskId,
          },
        },
        field: {
          connect: {
            id: fieldId,
          },
        },
      },
      include: {
        field: true,
      },
    });

    return NextResponse.json(customFieldValue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error updating custom field value:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a custom field value
export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string; fieldId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, fieldId } = await params;

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
                  role: { in: ['OWNER', 'ADMIN'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or you do not have permission' }, { status: 404 });
    }

    // Delete custom field value
    await prisma.customFieldValue.delete({
      where: {
        taskId_fieldId: {
          taskId,
          fieldId,
        },
      },
    });

    return NextResponse.json({ message: 'Custom field value deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom field value:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
