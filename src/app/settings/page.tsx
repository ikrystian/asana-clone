'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Bell,
  Shield,
  Upload,
  Trash2,
  Mail
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  email: z.string().email('Nieprawidłowy adres e-mail'),
  bio: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktualne hasło jest wymagane'),
  newPassword: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  confirmPassword: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Hasła nie pasują do siebie",
  path: ["confirmPassword"],
});

const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  taskAssigned: z.boolean().default(true),
  taskCompleted: z.boolean().default(true),
  mentionedInComment: z.boolean().default(true),
  projectUpdates: z.boolean().default(true),
  dailyDigest: z.boolean().default(false),
  weeklyDigest: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      role: '',
      department: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      taskAssigned: true,
      taskCompleted: true,
      mentionedInComment: true,
      projectUpdates: true,
      dailyDigest: false,
      weeklyDigest: true,
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        if (session?.user) {
          // In a real app, you would fetch the user's profile data from an API
          // For now, we'll use the session data
          profileForm.setValue('name', session.user.name || '');
          profileForm.setValue('email', session.user.email || '');
          
          // Mock data for demonstration
          profileForm.setValue('bio', 'Menedżer produktu z ponad 5-letnim doświadczeniem w produktach SaaS.');
          profileForm.setValue('role', 'Menedżer produktu');
          profileForm.setValue('department', 'Produkt');
          
          // Mock notification settings
          notificationForm.setValue('emailNotifications', true);
          notificationForm.setValue('taskAssigned', true);
          notificationForm.setValue('taskCompleted', true);
          notificationForm.setValue('mentionedInComment', true);
          notificationForm.setValue('projectUpdates', true);
          notificationForm.setValue('dailyDigest', false);
          notificationForm.setValue('weeklyDigest', true);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        toast.error('Nie udało się załadować danych użytkownika');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, profileForm, notificationForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    
    try {
      // In a real app, this would be an API call to update the user's profile
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the session with the new name
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
        },
      });
      
      toast.success('Profil został pomyślnie zaktualizowany');
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu:', error);
      toast.error('Nie udało się zaktualizować profilu');
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    
    try {
      // In a real app, this would be an API call to change the password
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Hasło zostało pomyślnie zmienione');
      passwordForm.reset();
    } catch (error) {
      console.error('Błąd podczas zmiany hasła:', error);
      toast.error('Nie udało się zmienić hasła');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onNotificationSubmit = async (data: NotificationFormValues) => {
    setIsSaving(true);
    
    try {
      // In a real app, this would be an API call to update notification settings
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Ustawienia powiadomień zostały zaktualizowane');
    } catch (error) {
      console.error('Błąd podczas aktualizacji ustawień powiadomień:', error);
      toast.error('Nie udało się zaktualizować ustawień powiadomień');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // In a real app, this would be an API call to delete the account
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Konto zostało pomyślnie usunięte');
      setIsDeleteDialogOpen(false);
      
      // Sign out and redirect to home page
      router.push('/auth/signout');
    } catch (error) {
      console.error('Błąd podczas usuwania konta:', error);
      toast.error('Nie udało się usunąć konta');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Ustawienia</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Powiadomienia
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Bezpieczeństwo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacje o profilu</CardTitle>
                <CardDescription>
                  Zaktualizuj informacje o profilu swojego konta i ustawienia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ) : (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                          <AvatarFallback>{getInitials(session?.user?.name || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" size="sm" className="mb-1">
                            <Upload className="h-4 w-4 mr-2" />
                            Zmień awatar
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            JPG, GIF lub PNG. Maksymalny rozmiar 2MB.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Imię i nazwisko</FormLabel>
                              <FormControl>
                                <Input placeholder="Twoje imię i nazwisko" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input placeholder="Twój e-mail" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rola</FormLabel>
                              <FormControl>
                                <Input placeholder="Twoja rola" {...field} />
                              </FormControl>
                              <FormDescription>
                                Twoja rola w organizacji
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dział</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Wybierz dział" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Engineering">Inżynieria</SelectItem>
                                  <SelectItem value="Design">Projekt</SelectItem>
                                  <SelectItem value="Product">Produkt</SelectItem>
                                  <SelectItem value="Marketing">Marketing</SelectItem>
                                  <SelectItem value="Sales">Sprzedaż</SelectItem>
                                  <SelectItem value="Operations">Operacje</SelectItem>
                                  <SelectItem value="HR">HR</SelectItem>
                                  <SelectItem value="Finance">Finanse</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Twój dział w organizacji
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biografia</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Opowiedz nam o sobie"
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Krótki opis o sobie
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ustawienia powiadomień</CardTitle>
                <CardDescription>
                  Zarządzaj sposobem otrzymywania powiadomień
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-6 w-10" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Powiadomienia e-mail</FormLabel>
                              <FormDescription>
                                Otrzymuj powiadomienia pocztą elektroniczną
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Rodzaje powiadomień</h3>
                        
                        <FormField
                          control={notificationForm.control}
                          name="taskAssigned"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Zadanie przypisane</FormLabel>
                                <FormDescription>
                                  Gdy zadanie zostanie Ci przypisane
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="taskCompleted"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Zadanie ukończone</FormLabel>
                                <FormDescription>
                                  Gdy utworzone przez Ciebie zadanie zostanie ukończone
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="mentionedInComment"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Wzmianka w komentarzu</FormLabel>
                                <FormDescription>
                                  Gdy ktoś wspomni o Tobie w komentarzu
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="projectUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Aktualizacje projektu</FormLabel>
                                <FormDescription>
                                  Gdy pojawią się aktualizacje w Twoich projektach
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Wiadomości e-mail z podsumowaniem</h3>
                        
                        <FormField
                          control={notificationForm.control}
                          name="dailyDigest"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Podsumowanie dzienne</FormLabel>
                                <FormDescription>
                                  Otrzymuj codzienne podsumowanie swoich zadań
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="weeklyDigest"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Podsumowanie tygodniowe</FormLabel>
                                <FormDescription>
                                  Otrzymuj cotygodniowe podsumowanie swoich zadań
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zmień hasło</CardTitle>
                <CardDescription>
                  Zaktualizuj swoje hasło, aby Twoje konto było bezpieczne
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aktualne hasło</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nowe hasło</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Hasło musi mieć co najmniej 8 znaków
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potwierdź nowe hasło</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? 'Zmienianie...' : 'Zmień hasło'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Strefa zagrożenia</CardTitle>
                <CardDescription>
                  Nieodwracalne i niszczące działania
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Usuń konto</h3>
                    <p className="text-sm text-muted-foreground">
                      Trwale usuń swoje konto i wszystkie swoje dane
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Usuń konto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń konto</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć swoje konto? Tej akcji nie można cofnąć, a wszystkie Twoje dane zostaną trwale usunięte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center p-3 border rounded-md bg-muted/50">
              <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-sm">{session?.user?.email}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Wpisz <strong>usuń moje konto</strong>, aby potwierdzić.
            </p>
            <Input placeholder="usuń moje konto" />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Anuluj
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Usuwanie...' : 'Usuń konto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}