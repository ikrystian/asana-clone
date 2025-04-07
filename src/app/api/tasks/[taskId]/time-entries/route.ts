import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const timeEntrySchema = z.object({
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
});

// Get all time entries for a task
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

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany({
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
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new time entry
export async function POST(
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
    const { description, startTime, endTime } = timeEntrySchema.parse(body);

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

    // Check if user already has an active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    });

    if (activeEntry && !endTime) {
      return NextResponse.json(
        { error: 'You already have an active time entry. Please stop it before starting a new one.' },
        { status: 400 }
      );
    }

    // Calculate duration if both start and end times are provided
    let duration = null;
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      duration = Math.floor((end - start) / 1000);
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        task: {
          connect: {
            id: taskId,
          },
        },
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

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
