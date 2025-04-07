'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState<Array<{ id: string; name: string; color: string }>>([]);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // Get all days in the month
    const monthDays = eachDayOfInterval({ start, end });

    // Get the start of the first week (might be in previous month)
    const firstWeekStart = startOfWeek(start, { weekStartsOn: 0 });

    // Get the end of the last week (might be in next month)
    const lastWeekEnd = endOfWeek(end, { weekStartsOn: 0 });

    // Get all days to display in the calendar
    const days = eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd });

    setCalendarDays(days);

    fetchTasks();
    fetchProjects();
  }, [currentMonth]);

  useEffect(() => {
    if (tasks.length > 0) {
      filterTasks();
    }
  }, [tasks, projectFilter]);

  // Initialize filtered tasks with all tasks when tasks are first loaded
  useEffect(() => {
    if (tasks.length > 0 && filteredTasks.length === 0) {
      setFilteredTasks(tasks);
    }
  }, [tasks, filteredTasks.length]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks/calendar');

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
      setFilteredTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');

      // Mock data for demonstration
      const mockTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task-${i + 1}`,
        title: `Task ${i + 1}`,
        status: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'][Math.floor(Math.random() * 4)],
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
        dueDate: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          Math.floor(Math.random() * 28) + 1
        ).toISOString(),
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
      setFilteredTasks(mockTasks);
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
    if (projectFilter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.project.id === projectFilter));
    }
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      try {
        const taskDate = parseISO(task.dueDate);
        return isSameDay(taskDate, day);
      } catch (error) {
        return false;
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleCreateTask = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    router.push(`/dashboard?dueDate=${formattedDate}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <Button onClick={() => router.push('/dashboard')}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Filter by:</span>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  {projectFilter === 'all' ? (
                    <span>All Projects</span>
                  ) : (
                    <span>
                      {projects.find(p => p.id === projectFilter)?.name || 'Project'}
                    </span>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projectFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProjectFilter('all')}
                className="text-xs"
              >
                Clear filter
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={`header-${i}`} className="text-center font-medium text-sm py-2">
                    <div className="h-4 w-8 bg-muted rounded mx-auto"></div>
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={`cell-${i}`} className="h-32 bg-muted/30 rounded-md animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center font-medium text-sm py-2">
                      {day}
                    </div>
                  ))}

                  {calendarDays.map((day) => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "h-32 rounded-md p-2 overflow-auto",
                          isCurrentMonth ? "bg-card" : "bg-muted/30",
                          isDayToday && "ring-2 ring-primary",
                          "border"
                        )}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              !isCurrentMonth && "text-muted-foreground",
                              isDayToday && "text-primary"
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleCreateTask(day)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="space-y-1">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-muted/50 p-1 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => handleTaskClick(task.id)}
                            >
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-1 h-3 rounded-full"
                                  style={{ backgroundColor: task.project.color }}
                                />
                                <span className="truncate">{task.title}</span>
                              </div>
                              {task.assignee && (
                                <div className="flex justify-end mt-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={task.assignee.image || ''} alt={task.assignee.name} />
                                    <AvatarFallback className="text-[8px]">
                                      {getInitials(task.assignee.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
