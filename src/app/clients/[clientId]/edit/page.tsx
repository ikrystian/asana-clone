import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ClientForm } from '@/components/clients/client-form';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface EditClientPageProps {
  params: Promise<{ clientId: string }>;
}

async function getClient(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      createdById: userId,
    },
  });

  return client;
}

export async function generateMetadata({ params }: EditClientPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      title: 'Brak autoryzacji - Asana Clone',
    };
  }

  const client = await getClient(resolvedParams.clientId, session.user.id);

  if (!client) {
    return {
      title: 'Klient nie znaleziony - Asana Clone',
    };
  }

  return {
    title: `Edytuj ${client.companyName} - Klienci - Asana Clone`,
    description: `Edytuj dane klienta ${client.companyName}`,
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    notFound();
  }

  const client = await getClient(resolvedParams.clientId, session.user.id);

  if (!client) {
    notFound();
  }

  // Maskuj hasła dla formularza (nie pokazuj rzeczywistych wartości)
  const clientData = {
    ...client,
    ftpPassword: client.ftpPassword ? '••••••••' : '',
    adminPassword: client.adminPassword ? '••••••••' : '',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edytuj klienta</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Zaktualizuj dane kontaktowe i dostępowe dla {client.companyName}
          </p>
        </div>
        <ClientForm initialData={clientData} isEditing={true} />
      </div>
    </DashboardLayout>
  );
}
