"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";

interface Client {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  projects: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  accesses: Array<{
    id: string;
    accessType: string;
    name?: string;
    url?: string;
    username?: string;
    port?: string;
    notes?: string;
    createdAt: string;
  }>;
  _count: {
    projects: number;
    accesses: number;
  };
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

export function ClientsList() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Błąd podczas pobierania klientów");
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Błąd:", error);
      toast.error("Nie udało się pobrać listy klientów");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (clientId: string, companyName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć klienta "${companyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania klienta");
      }

      toast.success("Klient został usunięty");
      fetchClients(); // Odśwież listę
    } catch (error) {
      console.error("Błąd:", error);
      toast.error("Nie udało się usunąć klienta");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ładowanie...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Klienci ({clients.length})
        </CardTitle>
        <Button onClick={() => router.push("/clients/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj klienta
        </Button>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Brak klientów
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Dodaj pierwszego klienta, aby rozpocząć zarządzanie danymi
              kontaktowymi i dostępowymi.
            </p>
            <Button onClick={() => router.push("/clients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj pierwszego klienta
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projekty</TableHead>
                <TableHead>Ostatnia aktualizacja</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.companyName}</div>
                      {client.contactPerson && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.contactPerson}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      )}
                      {client.websiteUrl && (
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3" />
                          <a
                            href={client.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Strona
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[client.status]}>
                      {statusLabels[client.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {client._count.projects}
                      </span>
                      {client.projects.slice(0, 3).map((project) => (
                        <div
                          key={project.id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                          title={project.name}
                        />
                      ))}
                      {client.projects.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{client.projects.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(client.updatedAt).toLocaleDateString("pl-PL")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Zobacz szczegóły
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/clients/${client.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete(client.id, client.companyName)
                          }
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
