import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';

// Endpoint do bezpiecznego pobierania hasła dostępu (tylko dla autoryzowanych użytkowników)
export async function POST(
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
    const access = await prisma.clientAccess.findFirst({
      where: {
        id: resolvedParams.accessId,
        clientId: resolvedParams.clientId,
        client: {
          createdById: session.user.id,
        },
      },
      select: {
        id: true,
        accessType: true,
        name: true,
        password: true,
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

    let decryptedPassword = '';
    
    try {
      if (access.password) {
        decryptedPassword = decrypt(access.password);
      }
    } catch (error) {
      console.error('Błąd podczas deszyfrowania hasła:', error);
      return NextResponse.json({ error: 'Nie udało się odszyfrować hasła' }, { status: 500 });
    }

    // Loguj próbę dostępu do hasła (dla audytu bezpieczeństwa)
    console.log(`Użytkownik ${session.user.email} uzyskał dostęp do hasła dostępu ${access.accessType} (${access.name || 'bez nazwy'}) dla klienta ${access.client.companyName} (ID: ${access.client.id})`);

    return NextResponse.json({ 
      password: decryptedPassword,
      clientName: access.client.companyName,
      accessType: access.accessType,
      accessName: access.name,
    });
  } catch (error) {
    console.error('Błąd podczas pobierania hasła dostępu:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
