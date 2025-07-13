import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { maskPassword } from '@/lib/encryption';

const clientSchema = z.object({
  companyName: z.string().min(2, 'Nazwa firmy musi mieć co najmniej 2 znaki'),
  contactPerson: z.string().optional(),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  websiteUrl: z.string().url('Nieprawidłowy URL strony').optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});



// Pobierz wszystkich klientów dla bieżącego użytkownika
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: {
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        accesses: {
          select: {
            id: true,
            accessType: true,
            name: true,
            url: true,
            username: true,
            password: true,
            port: true,
            notes: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            projects: true,
            accesses: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Maskuj hasła w dostępach
    const clientsWithMaskedPasswords = clients.map(client => ({
      ...client,
      accesses: client.accesses.map(access => ({
        ...access,
        password: access.password ? maskPassword(access.password) : null,
      })),
    }));

    return NextResponse.json(clientsWithMaskedPasswords);
  } catch (error) {
    console.error('Błąd podczas pobierania klientów:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

// Utwórz nowego klienta
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = clientSchema.parse(body);

    // Utwórz klienta
    const client = await prisma.client.create({
      data: {
        ...validatedData,
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        accesses: true,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Błąd podczas tworzenia klienta:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
