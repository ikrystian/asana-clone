'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Tytuł zadania jest wymagany'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.date().optional().nullable(),
  sectionId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  projectId: z.string().min(1, 'Projekt jest wymagany'), // Now required
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Project {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    name: string;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      sectionId: undefined,
      assigneeId: null,
      parentTaskId: null,
      projectId: '',
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch all projects
        const projectsResponse = await fetch('/api/projects');
        if (!projectsResponse.ok) {
          throw new Error('Nie udało się pobrać projektów');
        }
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Fetch all users
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania danych początkowych:', error);
        toast.error('Nie udało się załadować danych początkowych');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProjectSpecificData = async () => {
      const currentProjectId = form.watch('projectId');
      if (currentProjectId) {
        const project = projects.find(p => p.id === currentProjectId);
        setSelectedProject(project || null);

        if (project && project.sections && project.sections.length > 0) {
          form.setValue('sectionId', project.sections[0].id);
        } else {
          form.setValue('sectionId', undefined);
        }

        // Fetch project tasks for parent task selection
        try {
          const tasksResponse = await fetch(`/api/projects/${currentProjectId}/tasks`);
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            setTasks(tasksData);
          } else {
            setTasks([]);
          }
        } catch (error) {
          console.error('Błąd podczas pobierania zadań projektu:', error);
          setTasks([]);
        }
      } else {
        setSelectedProject(null);
        form.setValue('sectionId', undefined);
        setTasks([]);
      }
    };

    fetchProjectSpecificData();
  }, [form.watch('projectId'), projects]);

  async function onSubmit(data: TaskFormValues) {
    setIsLoading(true);

    try {
      const processedData = {
        ...data,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        assigneeId: data.assigneeId === 'unassigned' ? null : data.assigneeId,
        parentTaskId: data.parentTaskId === 'none' ? null : data.parentTaskId,
      };

      const response = await fetch(`/api/projects/${data.projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Nie udało się utworzyć zadania');
        return;
      }

      toast.success('Zadanie zostało pomyślnie utworzone!');
      router.push(`/tasks`);
    } catch (error) {
      toast.error('Coś poszło nie tak. Proszę spróbować ponownie.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Utwórz nowe zadanie</h1>
          <Card>
            <CardHeader>
              <CardTitle>Ładowanie...</CardTitle>
              <CardDescription>
                Proszę czekać, ładujemy dane
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Utwórz nowe zadanie</h1>

        <Card>
          <CardHeader>
            <CardTitle>Szczegóły zadania</CardTitle>
            <CardDescription>
              Utwórz nowe zadanie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projekt</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz projekt" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Wybierz projekt, do którego zostanie przypisane zadanie.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tytuł zadania</FormLabel>
                      <FormControl>
                        <Input placeholder="Zaprojektuj makietę strony głównej" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Opisz szczegółowo zadanie..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcjonalnie: dodaj szczegóły, wymagania lub kontekst dla tego zadania
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TODO">Do zrobienia</SelectItem>
                            <SelectItem value="IN_PROGRESS">W toku</SelectItem>
                            <SelectItem value="REVIEW">Recenzja</SelectItem>
                            <SelectItem value="DONE">Zakończone</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorytet</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz priorytet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Niski</SelectItem>
                            <SelectItem value="MEDIUM">Średni</SelectItem>
                            <SelectItem value="HIGH">Wysoki</SelectItem>
                            <SelectItem value="URGENT">Pilny</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Termin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: pl })
                                ) : (
                                  <span>Wybierz datę</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Opcjonalnie: ustaw termin wykonania tego zadania
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sekcja</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedProject || selectedProject.sections.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz sekcję" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedProject?.sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Przypisany</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Nieprzypisany" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">Nieprzypisany</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Opcjonalnie: przypisz to zadanie członkowi zespołu
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentTaskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zadanie nadrzędne</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                          disabled={!selectedProject || tasks.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Brak zadania nadrzędnego" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Brak zadania nadrzędnego</SelectItem>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Opcjonalnie: uczyń to zadanie podzadaniem innego zadania
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Tworzenie...' : 'Utwórz zadanie'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}