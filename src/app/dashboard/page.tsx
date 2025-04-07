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
          throw new Error('Failed to fetch projects');
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
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={() => router.push('/projects/new')}>
            <PlusSquare className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
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
                  <CardTitle>No projects yet</CardTitle>
                  <CardDescription>
                    Create your first project to get started
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => router.push('/projects/new')}>
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Create Project
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
                        {project.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CheckSquare className="mr-1 h-4 w-4" />
                        <span>{project._count.tasks} tasks</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        View Project
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Create a new project</CardTitle>
                    <CardDescription>
                      Start organizing your work in a new project
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/projects/new')}
                    >
                      <PlusSquare className="mr-2 h-4 w-4" />
                      New Project
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
                  <CardTitle>No recent tasks</CardTitle>
                  <CardDescription>
                    Your recently updated tasks will appear here
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => router.push('/tasks')}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    View All Tasks
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
                              ? 'To Do'
                              : task.status === 'IN_PROGRESS'
                              ? 'In Progress'
                              : task.status === 'REVIEW'
                              ? 'Review'
                              : 'Done'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => router.push('/tasks')}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    View All Tasks
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks due in the next 7 days</CardDescription>
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
                  <p>No upcoming deadlines</p>
                  <p className="text-sm">
                    Tasks with due dates will appear here
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push('/calendar')}>
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent activity in your workspace</CardDescription>
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
                  <p>No recent activity</p>
                  <p className="text-sm">
                    Activity from you and your team will appear here
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
