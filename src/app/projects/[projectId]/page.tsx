'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusSquare,
  MoreHorizontal,
  ListFilter,
  LayoutGrid,
  Calendar as CalendarIcon,
  BarChart2,
  Users,
  Settings,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KanbanBoard } from '@/components/project/kanban-board';
import { CalendarView } from '@/components/project/calendar-view';
import { TimelineView } from '@/components/project/timeline-view';
import { AutomationRules } from '@/components/project/automation-rules';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isPublic: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
  sections: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  automationRules?: Array<{
    id: string;
    name: string;
    trigger: {
      type: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: string;
      }>;
    };
    actions: Array<{
      type: string;
      parameters: Record<string, string>;
    }>;
    isActive: boolean;
    createdAt: string;
  }>;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  sectionId: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  subtasks: Array<{
    id: string;
    title: string;
    status: string;
    assignee: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
  }>;
  _count: {
    comments: number;
    attachments: number;
  };
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unwrap params outside of try/catch
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error('Nie udało się pobrać projektu');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch project tasks
        const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);
        if (!tasksResponse.ok) {
          throw new Error('Nie udało się pobrać zadań');
        }
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      } catch (error) {
        console.error('Błąd podczas pobierania danych projektu:', error);
        toast.error('Nie udało się załadować danych projektu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nie udało się usunąć projektu');
      }

      toast.success('Projekt został pomyślnie usunięty');
      router.push('/dashboard');
    } catch (error) {
      console.error('Błąd podczas usuwania projektu:', error);
      toast.error('Nie udało się usunąć projektu');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCreateTask = () => {
    router.push(`/projects/${projectId}/tasks/new`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isLoading ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </>
        ) : project ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <h1 className="text-3xl font-bold">{project.name}</h1>
                </div>
                {project.description && (
                  <p className="text-muted-foreground mt-1">{project.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateTask}>
                  <PlusSquare className="mr-2 h-4 w-4" />
                  Dodaj zadanie
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Opcje projektu</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(`/projects/${params.projectId}/settings`)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Ustawienia projektu
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/projects/${params.projectId}/members`)}>
                      <Users className="mr-2 h-4 w-4" />
                      Zarządzaj członkami
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń projekt
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Tabs defaultValue="list" onValueChange={setView}>
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="list">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Lista
                  </TabsTrigger>
                  <TabsTrigger value="board">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Tablica
                  </TabsTrigger>
                  <TabsTrigger value="calendar">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Kalendarz
                  </TabsTrigger>
                  <TabsTrigger value="gantt">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Oś czasu
                  </TabsTrigger>
                  <TabsTrigger value="automation">
                    <Settings className="mr-2 h-4 w-4" />
                    Automatyzacja
                  </TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filtruj
                </Button>
              </div>

              <TabsContent value="list" className="mt-6">
                {tasks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-muted p-3 mb-4">
                        <PlusSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Brak zadań</h3>
                      <p className="text-muted-foreground text-center max-w-sm mb-4">
                        Zacznij, tworząc swoje pierwsze zadanie w tym projekcie
                      </p>
                      <Button onClick={handleCreateTask}>
                        <PlusSquare className="mr-2 h-4 w-4" />
                        Dodaj zadanie
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <Card
                        key={task.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    task.status === 'DONE'
                                      ? 'bg-green-500'
                                      : task.priority === 'HIGH'
                                      ? 'bg-orange-500'
                                      : task.priority === 'URGENT'
                                      ? 'bg-red-500'
                                      : 'bg-blue-500'
                                  }`}
                                />
                                <h3 className="font-medium">{task.title}</h3>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              {task.dueDate && (
                                <div className="text-sm text-muted-foreground">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                              {task.assignee && (
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                    {task.assignee.name.charAt(0)}
                                  </div>
                                </div>
                              )}
                              <div
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor:
                                    task.status === 'DONE'
                                      ? 'var(--color-accent)'
                                      : task.status === 'IN_PROGRESS'
                                      ? 'var(--color-primary/10)'
                                      : task.status === 'REVIEW'
                                      ? 'var(--color-chart-1/10)'
                                      : 'var(--color-muted)',
                                  color:
                                    task.status === 'DONE'
                                      ? 'var(--color-accent-foreground)'
                                      : task.status === 'IN_PROGRESS'
                                      ? 'var(--color-primary)'
                                      : task.status === 'REVIEW'
                                      ? 'var(--color-chart-1)'
                                      : 'var(--color-muted-foreground)',
                                }}
                              >
                                {task.status === 'TODO'
                                  ? 'Do zrobienia'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'W toku'
                                  : task.status === 'REVIEW'
                                  ? 'Recenzja'
                                  : 'Zakończone'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="board" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {project.sections.length > 0 ? (
                      <KanbanBoard
                        projectId={projectId}
                        initialTasks={tasks}
                        sections={project.sections}
                        onCreateTask={(sectionId) => router.push(`/projects/${projectId}/tasks/new?sectionId=${sectionId}`)}
                        onTaskClick={(taskId) => router.push(`/tasks/${taskId}`)}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-medium mb-2">Brak dostępnych sekcji</h3>
                        <p className="text-muted-foreground mb-4">
                          Utwórz sekcje w swoim projekcie, aby korzystać z widoku tablicy Kanban
                        </p>
                        <Button variant="outline">Utwórz sekcje</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <CalendarView
                      tasks={tasks}
                      onTaskClick={(taskId) => router.push(`/tasks/${taskId}`)}
                      onCreateTask={(date) => {
                        const formattedDate = date.toISOString().split('T')[0];
                        router.push(`/projects/${projectId}/tasks/new?dueDate=${formattedDate}`);
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gantt" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <TimelineView
                      tasks={tasks}
                      onTaskClick={(taskId) => router.push(`/tasks/${taskId}`)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="automation" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <AutomationRules
                      projectId={projectId}
                      initialRules={project.automationRules || []}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Usuń projekt</DialogTitle>
                  <DialogDescription>
                    Czy na pewno chcesz usunąć ten projekt? Tej akcji nie można cofnąć,
                    a wszystkie zadania, komentarze i załączniki zostaną trwale usunięte.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Usuwanie...' : 'Usuń projekt'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Nie znaleziono projektu</h2>
            <p className="text-muted-foreground mb-4">
              Projekt, którego szukasz, nie istnieje lub nie masz do niego dostępu.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Wróć do pulpitu
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}