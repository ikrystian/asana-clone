"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
} from "lucide-react";
import { ClientAccessList } from "./client-access-list";

interface Client {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  websiteUrl: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  projects: Array<{
    id: string;
    name: string;
    color: string;
    description: string | null;
  }>;
  accesses: Array<{
    id: string;
    accessType: string;
    name?: string;
    url?: string;
    username?: string;
    password?: string;
    hasPassword?: boolean;
    port?: string;
    notes?: string;
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface ClientDetailsProps {
  client: Client;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  INACTIVE:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const statusLabels = {
  ACTIVE: "Aktywny",
  INACTIVE: "Nieaktywny",
  ARCHIVED: "Zarchiwizowany",
};

export function ClientDetails({ client }: ClientDetailsProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async () => {
    if (
      !confirm(`Czy na pewno chcesz usunąć klienta "${client.companyName}"?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania klienta");
      }

      toast.success("Klient został usunięty");
      router.push("/clients");
    } catch (error) {
      console.error("Błąd:", error);
      toast.error("Nie udało się usunąć klienta");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} skopiowano do schowka`);
    } catch (error) {
      toast.error("Nie udało się skopiować");
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {client.companyName}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={statusColors[client.status]}>
                {statusLabels[client.status]}
              </Badge>
              <span className="text-sm text-gray-500">
                Utworzono:{" "}
                {new Date(client.createdAt).toLocaleDateString("pl-PL")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/clients/${client.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Podstawowe informacje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informacje kontaktowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Osoba kontaktowa
                  </div>
                  <span className="font-medium">{client.contactPerson}</span>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{client.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(client.email!, "Email")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Telefon
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{client.phone}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(client.phone!, "Telefon")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Adres
                  </div>
                  <span className="font-medium">{client.address}</span>
                </div>
              </div>
            )}

            {client.websiteUrl && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 mt-0.5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Strona internetowa
                  </div>
                  <a
                    href={client.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {client.websiteUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dostępy klienta */}
      <ClientAccessList
        clientId={client.id}
        accesses={client.accesses}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Powiązane projekty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Powiązane projekty ({client.projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.projects.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Brak powiązanych projektów
              </p>
            ) : (
              <div className="space-y-3">
                {client.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informacje systemowe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacje systemowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Data utworzenia:</span>
              <span>{new Date(client.createdAt).toLocaleString("pl-PL")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ostatnia aktualizacja:</span>
              <span>{new Date(client.updatedAt).toLocaleString("pl-PL")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Utworzono przez:</span>
              <span>{client.createdBy.name}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
