import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ClientDetails } from "@/components/clients/client-details";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskPassword } from "@/lib/encryption";

interface ClientPageProps {
  params: Promise<{ clientId: string }>;
}

async function getClient(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      createdById: userId,
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
    return null;
  }

  // Maskuj hasła w dostępach i dodaj informację o istnieniu hasła
  const clientWithMaskedPasswords = {
    ...client,
    accesses: client.accesses.map((access) => ({
      ...access,
      password: access.password ? maskPassword(access.password) : null,
      hasPassword: !!access.password,
    })),
  };

  return clientWithMaskedPasswords;
}

export async function generateMetadata({
  params,
}: ClientPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      title: "Brak autoryzacji - Asana Clone",
    };
  }

  const client = await getClient(resolvedParams.clientId, session.user.id);

  if (!client) {
    return {
      title: "Klient nie znaleziony - Asana Clone",
    };
  }

  return {
    title: `${client.companyName} - Klienci - Asana Clone`,
    description: `Szczegóły klienta ${client.companyName}`,
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    notFound();
  }

  const client = await getClient(resolvedParams.clientId, session.user.id);

  if (!client) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ClientDetails client={client} />
      </div>
    </DashboardLayout>
  );
}
