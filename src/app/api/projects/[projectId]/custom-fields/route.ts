import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'CHECKBOX']),
  options: z.string().optional(),
  required: z.boolean().default(false),
});

// Get all custom fields for a project
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;

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

    // Get custom fields
    const customFields = await prisma.customField.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(customFields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new custom field
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;
    const body = await req.json();
    const { name, type, options, required } = customFieldSchema.parse(body);

    // Check if project exists and user is owner or admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or you do not have permission' }, { status: 404 });
    }

    // Create custom field
    const customField = await prisma.customField.create({
      data: {
        name,
        type,
        options,
        required,
        project: {
          connect: {
            id: projectId,
          },
        },
      },
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error creating custom field:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
