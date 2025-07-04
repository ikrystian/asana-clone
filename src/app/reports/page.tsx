'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  BarChart2,
  Download
} from 'lucide-react';

interface ProjectStats {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  completionRate: number;
  color?: string;
}

interface UserStats {
  id: string;
  name: string;
  tasksCompleted: number;
  tasksAssigned: number;
  avgCompletionTime: number;
}

interface TimeStats {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
}

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [priorityDistribution, setPriorityDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [selectedProject, selectedTimeRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch project statistics
      const projectsResponse = await fetch('/api/reports/projects');
      if (!projectsResponse.ok) {
        throw new Error('Nie udało się pobrać statystyk projektu');
      }
      const projectsData = await projectsResponse.json();

      // Add an "All Projects" option
      const allProjectsStats = {
        id: 'all',
        name: 'Wszystkie projekty',
        totalTasks: projectsData.reduce((sum: number, project: any) => sum + project.totalTasks, 0),
        completedTasks: projectsData.reduce((sum: number, project: any) => sum + project.completedTasks, 0),
        overdueTasks: projectsData.reduce((sum: number, project: any) => sum + project.overdueTasks, 0),
        upcomingTasks: projectsData.reduce((sum: number, project: any) => sum + project.upcomingTasks, 0),
        completionRate: projectsData.length > 0 ?
          Math.round(projectsData.reduce((sum: number, project: any) => sum + project.completedTasks, 0) /
          projectsData.reduce((sum: number, project: any) => sum + project.totalTasks, 0) * 100) : 0
      };

      setProjectStats([allProjectsStats, ...projectsData]);

      // Fetch user statistics
      const usersResponse = await fetch('/api/reports/users');
      if (!usersResponse.ok) {
        throw new Error('Nie udało się pobrać statystyk użytkownika');
      }
      const usersData = await usersResponse.json();

      // Transform user data to match the expected format
      const transformedUserData = usersData.map((user: any) => ({
        id: user.id,
        name: user.name,
        tasksCompleted: user.completedTasks,
        tasksAssigned: user.totalTasks,
        avgCompletionTime: (Math.random() * 3 + 1).toFixed(1), // This would come from the API in a real app
      }));

      setUserStats(transformedUserData);

      // Fetch task statistics based on selected time range
      const tasksResponse = await fetch(`/api/reports/tasks?timeRange=${selectedTimeRange}`);
      if (!tasksResponse.ok) {
        throw new Error('Nie udało się pobrać statystyk zadań');
      }
      const tasksData = await tasksResponse.json();

      setTimeStats(tasksData.timeStats);
      setStatusDistribution(tasksData.statusDistribution);
      setPriorityDistribution(tasksData.priorityDistribution);
    } catch (error) {
      console.error('Błąd podczas pobierania danych raportu:', error);
      toast.error('Nie udało się załadować danych raportu');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentProject = () => {
    return projectStats.find(p => p.id === selectedProject) || projectStats[0];
  };

  const getCompletionRate = (project: ProjectStats) => {
    return (project.completedTasks / project.totalTasks) * 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Raporty i analityka</h1>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Eksportuj raport
          </Button>
        </div>

        <div className="flex space-x-4">
          <div className="w-1/2">
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz projekt" />
              </SelectTrigger>
              <SelectContent>
                {projectStats.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2">
            <Select
              value={selectedTimeRange}
              onValueChange={setSelectedTimeRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz zakres czasu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Ostatni tydzień</SelectItem>
                <SelectItem value="month">Ostatni miesiąc</SelectItem>
                <SelectItem value="quarter">Ostatni kwartał</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                  <div className="h-2 w-full bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Współczynnik ukończenia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {Math.round(getCompletionRate(getCurrentProject()))}%
                  </div>
                  <Progress
                    value={getCompletionRate(getCurrentProject())}
                    className="bg-green-200"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {getCurrentProject().completedTasks} z {getCurrentProject().totalTasks} ukończonych zadań
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Zaległe zadania
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {getCurrentProject().overdueTasks}
                  </div>
                  <Progress
                    value={(getCurrentProject().overdueTasks / getCurrentProject().totalTasks) * 100}
                    className="bg-red-200"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {Math.round((getCurrentProject().overdueTasks / getCurrentProject().totalTasks) * 100)}% wszystkich zadań
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Nadchodzące zadania
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {getCurrentProject().upcomingTasks}
                  </div>
                  <Progress
                    value={(getCurrentProject().upcomingTasks / getCurrentProject().totalTasks) * 100}
                    className="bg-blue-200"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    Termin w ciągu najbliższych 7 dni
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                    Śr. czas ukończenia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    2.4 dni
                  </div>
                  <Progress value={60} className="bg-yellow-200" />
                  <div className="text-xs text-muted-foreground mt-2">
                    Od utworzenia zadania do jego ukończenia
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="tasks">
              <TabsList>
                <TabsTrigger value="tasks">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Metryki zadań
                </TabsTrigger>
                <TabsTrigger value="team">
                  <Users className="h-4 w-4 mr-2" />
                  Wydajność zespołu
                </TabsTrigger>
                <TabsTrigger value="time">
                  <Calendar className="h-4 w-4 mr-2" />
                  Analiza czasu
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rozkład statusów zadań</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Rozkład priorytetów zadań</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={priorityDistribution}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Zadania">
                              {priorityDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Wydajność członków zespołu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={userStats}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="tasksAssigned" name="Zadania przypisane" fill="#3b82f6" />
                          <Bar dataKey="tasksCompleted" name="Zadania ukończone" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="time" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Aktywność zadań w czasie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={timeStats}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="tasksCreated" name="Zadania utworzone" stroke="#3b82f6" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="tasksCompleted" name="Zadania ukończone" stroke="#22c55e" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}