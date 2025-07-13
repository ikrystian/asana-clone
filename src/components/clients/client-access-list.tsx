"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Globe,
  User,
  Key,
  Hash,
  StickyNote,
} from "lucide-react";
import { ClientAccessForm } from "./client-access-form";

interface ClientAccess {
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
}

interface ClientAccessListProps {
  clientId: string;
  accesses: ClientAccess[];
  onRefresh: () => void;
}

export function ClientAccessList({
  clientId,
  accesses,
  onRefresh,
}: ClientAccessListProps) {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingAccess, setEditingAccess] = useState<ClientAccess | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Map<string, string>
  >(new Map());

  const handleAddAccess = () => {
    setEditingAccess(null);
    setShowFormDialog(true);
  };

  const handleEditAccess = (access: ClientAccess) => {
    setEditingAccess(access);
    setShowFormDialog(true);
  };

  const handleDeleteAccess = async (accessId: string) => {
    try {
      const response = await fetch(
        `/api/clients/${clientId}/accesses/${accessId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas usuwania dostępu");
      }

      toast.success("Dostęp został usunięty");
      onRefresh();
    } catch (error: unknown) {
      console.error("Błąd:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} skopiowano do schowka`);
    } catch (error: unknown) {
      toast.error("Nie udało się skopiować do schowka");
    }
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    copyable = false,
    linkable = false,
  }: {
    icon: any;
    label: string;
    value?: string;
    copyable?: boolean;
    linkable?: boolean;
  }) => {
    if (!value) return null;

    return (
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-0.5 text-gray-500" />
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </div>
          <div className="flex items-center gap-2">
            {linkable ? (
              <a
                href={value.startsWith("http") ? value : `https://${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {value}
              </a>
            ) : (
              <span className="font-medium">{value}</span>
            )}
            {copyable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(value, label)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PasswordItem = ({
    accessId,
    hasPassword,
  }: {
    accessId: string;
    hasPassword: boolean;
  }) => {
    if (!hasPassword) return null;

    const decryptedPassword = decryptedPasswords.get(accessId) || "";

    const copyPassword = async () => {
      if (decryptedPassword) {
        // Jeśli hasło jest już pobrane, skopiuj je
        copyToClipboard(decryptedPassword, "Hasło");
      } else {
        // Pobierz hasło i skopiuj
        try {
          const response = await fetch(
            `/api/clients/${clientId}/accesses/${accessId}/password`,
            {
              method: "POST",
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Błąd podczas pobierania hasła");
          }

          const data = await response.json();
          setDecryptedPasswords((prev) =>
            new Map(prev).set(accessId, data.password)
          );
          copyToClipboard(data.password, "Hasło");
        } catch (error: unknown) {
          console.error("Błąd:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać hasła"
          );
        }
      }
    };

    return (
      <div className="flex items-start gap-3">
        <Key className="h-4 w-4 mt-0.5 text-gray-500" />
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Hasło</div>
          <div className="flex items-center gap-2">
            <span className="font-medium font-mono text-gray-400">
              ••••••••
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyPassword}
              className="h-6 w-6 p-0"
              title="Skopiuj hasło do schowka"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Dostępy ({accesses.length})
            </CardTitle>
            <CardDescription>
              Zarządzaj dostępami klienta do różnych systemów
            </CardDescription>
          </div>
          <Button onClick={handleAddAccess}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj dostęp
          </Button>
        </CardHeader>
        <CardContent>
          {accesses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Brak dostępów dla tego klienta</p>
              <p className="text-sm">
                Kliknij "Dodaj dostęp", aby dodać pierwszy dostęp
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {accesses.map((access) => (
                <Card key={access.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{access.accessType}</Badge>
                        {access.name && (
                          <span className="font-medium">{access.name}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAccess(access)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                "Czy na pewno chcesz usunąć ten dostęp? Ta akcja nie może być cofnięta."
                              )
                            ) {
                              handleDeleteAccess(access.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoItem
                      icon={Globe}
                      label="URL/Host"
                      value={access.url}
                      linkable={access.url?.startsWith("http")}
                      copyable
                    />
                    <InfoItem
                      icon={Hash}
                      label="Port"
                      value={access.port}
                      copyable
                    />
                    <InfoItem
                      icon={User}
                      label="Nazwa użytkownika"
                      value={access.username}
                      copyable
                    />
                    <PasswordItem
                      accessId={access.id}
                      hasPassword={access.hasPassword || !!access.password}
                    />
                    <InfoItem
                      icon={StickyNote}
                      label="Notatki"
                      value={access.notes}
                    />
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Utworzono:{" "}
                      {new Date(access.createdAt).toLocaleDateString("pl-PL")}{" "}
                      przez {access.createdBy.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientAccessForm
        clientId={clientId}
        initialData={editingAccess}
        isOpen={showFormDialog}
        onClose={() => {
          setShowFormDialog(false);
          setEditingAccess(null);
        }}
        onSuccess={onRefresh}
      />
    </>
  );
}
