import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { maskPassword } from '@/lib/encryption';

const clientUpdateSchema = z.object({
  companyName: z.string().min(2, 'Nazwa firmy musi mieć co najmniej 2 znaki').optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  websiteUrl: z.string().url('Nieprawidłowy URL strony').optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

// Pobierz szczegóły klienta
export async function GET(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: params.clientId,
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
            description: true,
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
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Klient nie został znaleziony' }, { status: 404 });
    }

    // Maskuj hasła w dostępach
    const clientWithMaskedPasswords = {
      ...client,
      accesses: client.accesses.map(access => ({
        ...access,
        password: access.password ? maskPassword(access.password) : null,
        hasPassword: !!access.password, // Dodaj informację o tym, czy hasło istnieje
      })),
    };

    console.log('API Response:', JSON.stringify(clientWithMaskedPasswords, null, 2));
    return NextResponse.json(clientWithMaskedPasswords);
  } catch (error) {
    console.error('Błąd podczas pobierania klienta:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

// Aktualizuj klienta
export async function PUT(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy klient istnieje i należy do użytkownika
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.clientId,
        createdById: session.user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Klient nie został znaleziony' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = clientUpdateSchema.parse(body);

    // Aktualizuj klienta
    const updatedClient = await prisma.client.update({
      where: {
        id: params.clientId,
      },
      data: validatedData,
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
            description: true,
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
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Maskuj hasła w dostępach
    const clientWithMaskedPasswords = {
      ...updatedClient,
      accesses: updatedClient.accesses.map(access => ({
        ...access,
        password: access.password ? maskPassword(access.password) : null,
      })),
    };

    return NextResponse.json(clientWithMaskedPasswords);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Błąd podczas aktualizacji klienta:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

// Usuń klienta
export async function DELETE(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy klient istnieje i należy do użytkownika
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.clientId,
        createdById: session.user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Klient nie został znaleziony' }, { status: 404 });
    }

    // Usuń klienta
    await prisma.client.delete({
      where: {
        id: params.clientId,
      },
    });

    return NextResponse.json({ message: 'Klient został usunięty' });
  } catch (error) {
    console.error('Błąd podczas usuwania klienta:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
