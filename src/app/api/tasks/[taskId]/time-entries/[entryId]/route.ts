import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const timeEntryUpdateSchema = z.object({
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

// Get a specific time entry
export async function GET(
  req: Request,
  { params }: { params: { taskId: string; entryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, entryId } = await params;

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

    // Get time entry
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
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

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error('Error fetching time entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a time entry
export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string; entryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, entryId } = await params;
    const body = await req.json();
    const { description, startTime, endTime } = timeEntryUpdateSchema.parse(body);

    // Check if time entry exists and belongs to user
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        taskId,
        userId: session.user.id,
      },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found or you do not have permission to update it' }, { status: 404 });
    }

    // Calculate duration if both start and end times are provided
    let duration = null;
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      duration = Math.floor((end - start) / 1000);
    } else if (timeEntry.startTime && endTime) {
      const start = timeEntry.startTime.getTime();
      const end = new Date(endTime).getTime();
      duration = Math.floor((end - start) / 1000);
    } else if (startTime && timeEntry.endTime) {
      const start = new Date(startTime).getTime();
      const end = timeEntry.endTime.getTime();
      duration = Math.floor((end - start) / 1000);
    }

    // Update time entry
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: {
        id: entryId,
      },
      data: {
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        duration,
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

    return NextResponse.json(updatedTimeEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error updating time entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a time entry
export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string; entryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, entryId } = await params;

    // Check if time entry exists and belongs to user
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        taskId,
        userId: session.user.id,
      },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Delete time entry
    await prisma.timeEntry.delete({
      where: {
        id: entryId,
      },
    });

    return NextResponse.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
