import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Add a member to a project
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const body = await req.json();
    const { userId } = addMemberSchema.parse(body);

    // Check if project exists and current user is the owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to add members to it' },
        { status: 404 }
      );
    }

    // Check if the user to be added exists
    const userToAdd = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
    }

    // Add the user as a project member
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role: 'MEMBER', // Default role
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

    return NextResponse.json(projectMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error adding project member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove a member from a project
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if project exists and current user is the owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to remove members from it' },
        { status: 404 }
      );
    }

    // Prevent owner from removing themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Project owner cannot be removed from the project' }, { status: 403 });
    }

    // Check if the member exists in the project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'User is not a member of this project' }, { status: 404 });
    }

    // Remove the project member
    await prisma.projectMember.delete({
      where: {
        id: existingMember.id,
      },
    });

    return NextResponse.json({ message: 'Project member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all members of a project
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    // Check if project exists and current user has access
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
      return NextResponse.json({ error: 'Project not found or you do not have permission to view it' }, { status: 404 });
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
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

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
