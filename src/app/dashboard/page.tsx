'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusSquare, Folder, CheckSquare, Clock, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: {
    tasks: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: {
    id: string;
    name: string;
    color: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects');
        if (!projectsResponse.ok) {
          throw new Error('Nie udało się pobrać projektów');
        }
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Fetch recent tasks
        const tasksResponse = await fetch('/api/tasks/recent');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setRecentTasks(tasksData);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania danych pulpitu:', error);
        toast.error('Nie udało się załadować danych pulpitu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pulpit</h1>
          <Button onClick={() => router.push('/projects/new')}>
            <PlusSquare className="mr-2 h-4 w-4" />
            Nowy projekt
          </Button>
        </div>

        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Projekty</TabsTrigger>
            <TabsTrigger value="tasks">Ostatnie zadania</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Brak projektów</CardTitle>
                  <CardDescription>
                    Utwórz swój pierwszy projekt, aby rozpocząć
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => router.push('/projects/new')}>
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Utwórz projekt
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                      </div>
                      <CardDescription>
                        {project.description || 'Brak opisu'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CheckSquare className="mr-1 h-4 w-4" />
                        <span>{project._count.tasks} zadania</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        Zobacz projekt
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Utwórz nowy projekt</CardTitle>
                    <CardDescription>
                      Zacznij organizować swoją pracę w nowym projekcie
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/projects/new')}
                    >
                      <PlusSquare className="mr-2 h-4 w-4" />
                      Nowy projekt
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
          <TabsContent value="tasks" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Brak ostatnich zadań</CardTitle>
                  <CardDescription>
                    Twoje ostatnio zaktualizowane zadania pojawią się tutaj
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => router.push('/tasks')}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Zobacz wszystkie zadania
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <Card key={task.id}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-medium hover:underline"
                          >
                            {task.title}
                          </Link>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor:
                                task.status === 'DONE'
                                  ? 'var(--color-accent)'
                                  : task.priority === 'HIGH' || task.priority === 'URGENT'
                                  ? 'var(--color-destructive/10)'
                                  : 'var(--color-muted)',
                              color:
                                task.status === 'DONE'
                                  ? 'var(--color-accent-foreground)'
                                  : task.priority === 'HIGH' || task.priority === 'URGENT'
                                  ? 'var(--color-destructive)'
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
                    </CardHeader>
                  </Card>
                ))}
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => router.push('/tasks')}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Zobacz wszystkie zadania
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nadchodzące terminy</CardTitle>
              <CardDescription>Zadania do wykonania w ciągu najbliższych 7 dni</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Brak nadchodzących terminów</p>
                  <p className="text-sm">
                    Zadania z terminami pojawią się tutaj
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push('/calendar')}>
                <Calendar className="mr-2 h-4 w-4" />
                Zobacz kalendarz
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Aktywność</CardTitle>
              <CardDescription>Ostatnia aktywność w Twoim obszarze roboczym</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Brak ostatniej aktywności</p>
                  <p className="text-sm">
                    Aktywność Twoja i Twojego zespołu pojawi się tutaj
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}