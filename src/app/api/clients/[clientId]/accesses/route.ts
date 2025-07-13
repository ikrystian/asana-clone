import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { encrypt, maskPassword } from '@/lib/encryption';

const clientAccessSchema = z.object({
  accessType: z.string().min(1, 'Typ dostępu jest wymagany'),
  name: z.string().optional(),
  url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  port: z.string().optional(),
  notes: z.string().optional(),
});

// Funkcja do bezpiecznego szyfrowania haseł
function encryptPassword(password: string): string {
  return encrypt(password);
}

// Pobierz wszystkie dostępy dla klienta
export async function GET(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy klient istnieje i należy do użytkownika
    const client = await prisma.client.findFirst({
      where: {
        id: params.clientId,
        createdById: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Klient nie został znaleziony' }, { status: 404 });
    }

    // Pobierz dostępy
    const accesses = await prisma.clientAccess.findMany({
      where: {
        clientId: params.clientId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Maskuj hasła w odpowiedzi
    const accessesWithMaskedPasswords = accesses.map(access => ({
      ...access,
      password: maskPassword(access.password || ''),
    }));

    return NextResponse.json(accessesWithMaskedPasswords);
  } catch (error) {
    console.error('Błąd podczas pobierania dostępów:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

// Utwórz nowy dostęp dla klienta
export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy klient istnieje i należy do użytkownika
    const client = await prisma.client.findFirst({
      where: {
        id: resolvedParams.clientId,
        createdById: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Klient nie został znaleziony' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = clientAccessSchema.parse(body);

    // Szyfruj hasło jeśli jest podane
    const encryptedData = {
      ...validatedData,
      password: validatedData.password
        ? encryptPassword(validatedData.password)
        : null,
    };

    // Utwórz dostęp
    const access = await prisma.clientAccess.create({
      data: {
        ...encryptedData,
        client: {
          connect: {
            id: resolvedParams.clientId,
          },
        },
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
          },
        },
      },
    });

    // Maskuj hasło w odpowiedzi
    const accessWithMaskedPassword = {
      ...access,
      password: maskPassword(access.password || ''),
    };

    return NextResponse.json(accessWithMaskedPassword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Błąd podczas tworzenia dostępu:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
