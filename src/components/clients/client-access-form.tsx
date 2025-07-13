"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const clientAccessSchema = z.object({
  accessType: z.string().min(1, "Typ dostępu jest wymagany"),
  name: z.string().optional(),
  url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  port: z.string().optional(),
  notes: z.string().optional(),
});

type ClientAccessFormValues = z.infer<typeof clientAccessSchema>;











// Predefiniowane typy dostępów
const ACCESS_TYPES = [
  "FTP",
  "Panel administracyjny",
  "Strona WWW",
  "SSH",
  "Baza danych",
  "Email",
  "Hosting",
  "Domena",
  "CDN",
  "API",
  "Inne",
];

export function ClientAccessForm({
  clientId,
  initialData,
  isOpen,
  onClose,
  onSuccess,
}: ClientAccessFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<ClientAccessFormValues>({
    resolver: zodResolver(clientAccessSchema),
    defaultValues: {
      accessType: initialData?.accessType || "",
      name: initialData?.name || "",
      url: initialData?.url || "",
      username: initialData?.username || "",
      password:
        initialData?.password === "••••••••" ? "" : initialData?.password || "",
      port: initialData?.port || "",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: ClientAccessFormValues) => {
    setIsLoading(true);
    try {
      const url = isEditing
        ? `/api/clients/${clientId}/accesses/${initialData.id}`
        : `/api/clients/${clientId}/accesses`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas zapisywania dostępu");
      }

      toast.success(
        isEditing ? "Dostęp został zaktualizowany" : "Dostęp został dodany"
      );

      form.reset();
      onClose();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Błąd:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edytuj dostęp" : "Dodaj nowy dostęp"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Zaktualizuj informacje o dostępie klienta."
              : "Dodaj nowy dostęp dla klienta. Możesz określić dowolny typ dostępu."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ dostępu *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz typ dostępu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Możliwość wpisania własnego typu dostępu */}
              {form.watch("accessType") === "Inne" && (
                <FormField
                  control={form.control}
                  name="accessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Własny typ dostępu</FormLabel>
                      <FormControl>
                        <Input placeholder="Wpisz typ dostępu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa dostępu</FormLabel>
                    <FormControl>
                      <Input placeholder="np. Serwer produkcyjny" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL/Host</FormLabel>
                    <FormControl>
                      <Input placeholder="np. ftp.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 21, 22, 3306" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa użytkownika</FormLabel>
                    <FormControl>
                      <Input placeholder="Login" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          isEditing
                            ? "Pozostaw puste, aby nie zmieniać"
                            : "Hasło"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notatki</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatkowe informacje o dostępie..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Zaktualizuj" : "Dodaj dostęp"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
