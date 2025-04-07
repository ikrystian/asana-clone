'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  project: {
    id: string;
    name: string;
    color: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState<Array<{ id: string; name: string; color: string }>>([]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks/my-tasks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      
      // Mock data for demonstration
      const mockTasks = Array.from({ length: 15 }, (_, i) => ({
        id: `task-${i + 1}`,
        title: `Task ${i + 1}`,
        description: i % 3 === 0 ? `Description for task ${i + 1}` : null,
        status: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'][Math.floor(Math.random() * 4)],
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
        dueDate: i % 2 === 0 ? new Date(Date.now() + (Math.random() * 14 - 7) * 86400000).toISOString() : null,
        completedAt: i % 4 === 0 ? new Date().toISOString() : null,
        project: {
          id: `project-${Math.floor(Math.random() * 3) + 1}`,
          name: ['Marketing', 'Development', 'Design'][Math.floor(Math.random() * 3)],
          color: ['#4299E1', '#48BB78', '#ED8936'][Math.floor(Math.random() * 3)],
        },
        assignee: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          image: null,
        },
      }));
      
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // Mock data for demonstration
      const mockProjects = [
        { id: 'project-1', name: 'Marketing', color: '#4299E1' },
        { id: 'project-2', name: 'Development', color: '#48BB78' },
        { id: 'project-3', name: 'Design', color: '#ED8936' },
      ];
      
      setProjects(mockProjects);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project.id === projectFilter);
    }
    
    setFilteredTasks(filtered);
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Optimistically update UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: newStatus,
                completedAt: newStatus === 'DONE' ? new Date().toISOString() : null
              } 
            : task
        )
      );
      
      // In a real app, this would be an API call
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      toast.success(`Task marked as ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      
      // Revert the optimistic update
      fetchTasks();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'REVIEW':
        return 'bg-yellow-500';
      case 'DONE':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-500';
      case 'MEDIUM':
        return 'bg-green-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'URGENT':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="outline" className="bg-gray-100">To Do</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-100">In Progress</Badge>;
      case 'REVIEW':
        return <Badge variant="outline" className="bg-yellow-100">Review</Badge>;
      case 'DONE':
        return <Badge variant="outline" className="bg-green-100">Done</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="outline" className="bg-blue-100">Low</Badge>;
      case 'MEDIUM':
        return <Badge variant="outline" className="bg-green-100">Medium</Badge>;
      case 'HIGH':
        return <Badge variant="outline" className="bg-orange-100">High</Badge>;
      case 'URGENT':
        return <Badge variant="outline" className="bg-red-100">Urgent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isDueSoon = (dueDate: string) => {
    if (!dueDate) return false;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 2;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'DONE') return false;
    
    const due = new Date(dueDate);
    const now = new Date();
    
    return due < now;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <Button onClick={() => router.push('/dashboard')}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Priority</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Project</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-md animate-pulse">
                        <div className="h-5 w-5 rounded-full bg-muted"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-3/4 bg-muted rounded"></div>
                          <div className="h-3 w-1/2 bg-muted rounded"></div>
                        </div>
                        <div className="h-6 w-16 bg-muted rounded"></div>
                        <div className="h-6 w-16 bg-muted rounded"></div>
                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                        ? 'Try adjusting your filters to see more tasks'
                        : 'You have no tasks assigned to you'}
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center p-4 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <Checkbox
                          checked={task.status === 'DONE'}
                          onCheckedChange={(checked) => {
                            // Stop propagation to prevent task click
                            event?.stopPropagation();
                            handleStatusChange(task.id, checked ? 'DONE' : 'TODO');
                          }}
                          className="mr-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2",
                                getPriorityColor(task.priority)
                              )}
                            />
                            <div className="font-medium truncate">{task.title}</div>
                          </div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground truncate mt-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: task.project.color }}
                            />
                            <span className="text-sm">{task.project.name}</span>
                          </div>
                          {getStatusBadge(task.status)}
                          {task.dueDate && (
                            <div
                              className={cn(
                                "flex items-center text-sm",
                                isOverdue(task.dueDate, task.status)
                                  ? "text-red-500"
                                  : isDueSoon(task.dueDate)
                                  ? "text-yellow-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                          )}
                          {task.assignee && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={task.assignee.image || ''} alt={task.assignee.name} />
                              <AvatarFallback>{getInitials(task.assignee.name)}</AvatarFallback>
                            </Avatar>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'TODO');
                                }}
                              >
                                Mark as To Do
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'IN_PROGRESS');
                                }}
                              >
                                Mark as In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'REVIEW');
                                }}
                              >
                                Mark as Review
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'DONE');
                                }}
                              >
                                Mark as Done
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                  <p className="text-muted-foreground mb-4">
                    Calendar view will be implemented in a future update
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
