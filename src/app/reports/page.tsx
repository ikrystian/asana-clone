'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
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
      // In a real app, this would be API calls to get report data
      // For now, we'll simulate it with mock data
      
      // Mock project stats
      const mockProjects = [
        { id: 'all', name: 'All Projects', totalTasks: 120, completedTasks: 78, overdueTasks: 12, upcomingTasks: 30 },
        { id: 'p1', name: 'Marketing Campaign', totalTasks: 45, completedTasks: 32, overdueTasks: 5, upcomingTasks: 8 },
        { id: 'p2', name: 'Website Redesign', totalTasks: 38, completedTasks: 25, overdueTasks: 3, upcomingTasks: 10 },
        { id: 'p3', name: 'Product Launch', totalTasks: 37, completedTasks: 21, overdueTasks: 4, upcomingTasks: 12 },
      ];
      
      // Mock user stats
      const mockUsers = [
        { id: 'u1', name: 'John Doe', tasksCompleted: 28, tasksAssigned: 35, avgCompletionTime: 2.3 },
        { id: 'u2', name: 'Jane Smith', tasksCompleted: 32, tasksAssigned: 40, avgCompletionTime: 1.8 },
        { id: 'u3', name: 'Bob Johnson', tasksCompleted: 18, tasksAssigned: 25, avgCompletionTime: 3.1 },
      ];
      
      // Generate time stats based on selected range
      const today = new Date();
      let startDate, endDate;
      
      if (selectedTimeRange === 'week') {
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
      } else if (selectedTimeRange === 'month') {
        startDate = subDays(today, 30);
        endDate = today;
      } else {
        startDate = subDays(today, 90);
        endDate = today;
      }
      
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const mockTimeStats = dateRange.map(date => ({
        date: format(date, 'MMM dd'),
        tasksCreated: Math.floor(Math.random() * 10),
        tasksCompleted: Math.floor(Math.random() * 8),
      }));
      
      // Mock status distribution
      const mockStatusDistribution = [
        { name: 'To Do', value: 30, color: '#94a3b8' },
        { name: 'In Progress', value: 45, color: '#3b82f6' },
        { name: 'Review', value: 15, color: '#eab308' },
        { name: 'Done', value: 65, color: '#22c55e' },
      ];
      
      // Mock priority distribution
      const mockPriorityDistribution = [
        { name: 'Low', value: 25, color: '#3b82f6' },
        { name: 'Medium', value: 55, color: '#22c55e' },
        { name: 'High', value: 30, color: '#f97316' },
        { name: 'Urgent', value: 10, color: '#ef4444' },
      ];
      
      setProjectStats(mockProjects);
      setUserStats(mockUsers);
      setTimeStats(mockTimeStats);
      setStatusDistribution(mockStatusDistribution);
      setPriorityDistribution(mockPriorityDistribution);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
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
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="flex space-x-4">
          <div className="w-1/2">
            <Select 
              value={selectedProject} 
              onValueChange={setSelectedProject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
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
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
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
                    Completion Rate
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
                    {getCurrentProject().completedTasks} of {getCurrentProject().totalTasks} tasks completed
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Overdue Tasks
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
                    {Math.round((getCurrentProject().overdueTasks / getCurrentProject().totalTasks) * 100)}% of total tasks
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Upcoming Tasks
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
                    Due in the next 7 days
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                    Avg. Completion Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    2.4 days
                  </div>
                  <Progress value={60} className="bg-yellow-200" />
                  <div className="text-xs text-muted-foreground mt-2">
                    From task creation to completion
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="tasks">
              <TabsList>
                <TabsTrigger value="tasks">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Task Metrics
                </TabsTrigger>
                <TabsTrigger value="team">
                  <Users className="h-4 w-4 mr-2" />
                  Team Performance
                </TabsTrigger>
                <TabsTrigger value="time">
                  <Calendar className="h-4 w-4 mr-2" />
                  Time Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Status Distribution</CardTitle>
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
                      <CardTitle>Task Priority Distribution</CardTitle>
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
                            <Bar dataKey="value" name="Tasks">
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
                    <CardTitle>Team Member Performance</CardTitle>
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
                          <Bar dataKey="tasksAssigned" name="Tasks Assigned" fill="#3b82f6" />
                          <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="time" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Activity Over Time</CardTitle>
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
                          <Line type="monotone" dataKey="tasksCreated" name="Tasks Created" stroke="#3b82f6" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="tasksCompleted" name="Tasks Completed" stroke="#22c55e" />
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
