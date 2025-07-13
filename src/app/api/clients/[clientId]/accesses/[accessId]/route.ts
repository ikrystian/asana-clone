import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { encrypt, maskPassword, isMaskedPassword } from '@/lib/encryption';

const clientAccessUpdateSchema = z.object({
  accessType: z.string().min(1, 'Typ dostępu jest wymagany').optional(),
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

// Pobierz szczegóły dostępu
export async function GET(
  req: Request,
  { params }: { params: { clientId: string; accessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy dostęp istnieje i należy do klienta użytkownika
    const access = await prisma.clientAccess.findFirst({
      where: {
        id: params.accessId,
        clientId: params.clientId,
        client: {
          createdById: session.user.id,
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
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: 'Dostęp nie został znaleziony' }, { status: 404 });
    }

    // Maskuj hasło w odpowiedzi
    const accessWithMaskedPassword = {
      ...access,
      password: maskPassword(access.password || ''),
    };

    return NextResponse.json(accessWithMaskedPassword);
  } catch (error) {
    console.error('Błąd podczas pobierania dostępu:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

// Aktualizuj dostęp
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ clientId: string; accessId: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy dostęp istnieje i należy do klienta użytkownika
    const existingAccess = await prisma.clientAccess.findFirst({
      where: {
        id: resolvedParams.accessId,
        clientId: resolvedParams.clientId,
        client: {
          createdById: session.user.id,
        },
      },
    });

    if (!existingAccess) {
      return NextResponse.json({ error: 'Dostęp nie został znaleziony' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = clientAccessUpdateSchema.parse(body);

    // Przygotuj dane do aktualizacji
    const updateData: Record<string, unknown> = { ...validatedData };

    // Szyfruj hasło jeśli jest podane i różne od maskowanej wartości
    if (validatedData.password && !isMaskedPassword(validatedData.password)) {
      updateData.password = encryptPassword(validatedData.password);
    } else if (validatedData.password === '') {
      updateData.password = null;
    } else if (validatedData.password && isMaskedPassword(validatedData.password)) {
      delete updateData.password; // Nie aktualizuj jeśli jest maskowane
    }

    // Aktualizuj dostęp
    const updatedAccess = await prisma.clientAccess.update({
      where: {
        id: resolvedParams.accessId,
      },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Maskuj hasło w odpowiedzi
    const accessWithMaskedPassword = {
      ...updatedAccess,
      password: maskPassword(updatedAccess.password || ''),
    };

    return NextResponse.json(accessWithMaskedPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Błąd podczas aktualizacji dostępu:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

// Usuń dostęp
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ clientId: string; accessId: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Sprawdź czy dostęp istnieje i należy do klienta użytkownika
    const existingAccess = await prisma.clientAccess.findFirst({
      where: {
        id: resolvedParams.accessId,
        clientId: resolvedParams.clientId,
        client: {
          createdById: session.user.id,
        },
      },
    });

    if (!existingAccess) {
      return NextResponse.json({ error: 'Dostęp nie został znaleziony' }, { status: 404 });
    }

    // Usuń dostęp
    await prisma.clientAccess.delete({
      where: {
        id: resolvedParams.accessId,
      },
    });

    return NextResponse.json({ message: 'Dostęp został usunięty' });
  } catch (error) {
    console.error('Błąd podczas usuwania dostępu:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
