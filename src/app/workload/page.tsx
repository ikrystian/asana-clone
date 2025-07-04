'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
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

interface UserWorkload {
  user: User;
  tasks: Task[];
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
}

export default function WorkloadPage() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [workloads, setWorkloads] = useState<UserWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Ensure currentWeek is a valid date
      const validDate = new Date(currentWeek);
      if (isNaN(validDate.getTime())) {
        // If invalid, use current date
        setCurrentWeek(new Date());
        return;
      }

      const start = startOfWeek(validDate, { weekStartsOn: 1 }); // Start on Monday
      const end = endOfWeek(validDate, { weekStartsOn: 1 }); // End on Sunday
      const days = eachDayOfInterval({ start, end });
      setWeekDays(days);

      fetchWorkloadData();
    } catch (error) {
      console.error('Błąd podczas ustawiania dni tygodnia:', error);
      // Fallback to empty array
      setWeekDays([]);
    }
  }, [currentWeek]);

  const fetchWorkloadData = async () => {
    setIsLoading(true);
    try {
      // Format the current week for the API request
      const weekParam = currentWeek.toISOString();
      const response = await fetch(`/api/workload?week=${weekParam}`);

      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych o obciążeniu pracą');
      }

      const data = await response.json();
      setWorkloads(data);
    } catch (error) {
      console.error('Błąd podczas pobierania danych o obciążeniu pracą:', error);
      toast.error('Nie udało się załadować danych o obciążeniu pracą');

      // Mock data for demonstration
      const mockUsers = [
        { id: '1', name: 'Jan Kowalski', email: 'jan@example.com', image: null },
        { id: '2', name: 'Anna Nowak', email: 'anna@example.com', image: null },
        { id: '3', name: 'Piotr Wiśniewski', email: 'piotr@example.com', image: null },
      ];

      const mockWorkloads = mockUsers.map(user => ({
        user,
        tasks: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
          id: `task-${user.id}-${i}`,
          title: `Zadanie ${i + 1}`,
          status: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'][Math.floor(Math.random() * 4)],
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
          dueDate: new Date(Date.now() + (Math.random() * 14 - 7) * 86400000).toISOString(),
          project: {
            id: `project-${Math.floor(Math.random() * 3) + 1}`,
            name: ['Marketing', 'Rozwój', 'Projekt'][Math.floor(Math.random() * 3)],
            color: ['#4299E1', '#48BB78', '#ED8936'][Math.floor(Math.random() * 3)],
          },
        })),
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        upcomingTasks: 0,
      }));

      // Calculate statistics
      mockWorkloads.forEach(workload => {
        workload.totalTasks = workload.tasks.length;
        workload.completedTasks = workload.tasks.filter(task => task.status === 'DONE').length;
        workload.overdueTasks = workload.tasks.filter(task =>
          task.status !== 'DONE' &&
          task.dueDate &&
          new Date(task.dueDate) < new Date()
        ).length;
        workload.upcomingTasks = workload.tasks.filter(task =>
          task.status !== 'DONE' &&
          task.dueDate &&
          new Date(task.dueDate) > new Date() &&
          new Date(task.dueDate) < new Date(Date.now() + 7 * 86400000)
        ).length;
      });

      setWorkloads(mockWorkloads);
    } finally {
      setIsLoading(false);
    }
  };

  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const prevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getTasksForDay = (tasks: Task[], day: Date) => {
    try {
      return tasks.filter(task => {
        if (!task.dueDate) return false;

        try {
          const taskDate = new Date(task.dueDate);
          if (isNaN(taskDate.getTime())) return false;
          return isSameDay(taskDate, day);
        } catch {
          return false;
        }
      });
    } catch (error) {
      console.error('Błąd podczas filtrowania zadań na dany dzień:', error);
      return [];
    }
  };

  const getWorkloadColor = (completionRate: number, overdueCount: number) => {
    if (overdueCount > 0) return 'bg-red-500';
    if (completionRate < 0.3) return 'bg-green-500';
    if (completionRate < 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Obciążenie pracą zespołu</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {weekDays.length > 0 ? (
                <>Tydzień od {format(weekDays[0], 'd MMM', { locale: pl })} - {format(weekDays[6], 'd MMM, yyyy', { locale: pl })}</>
              ) : (
                'Ładowanie danych tygodnia...'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div className="h-4 w-48 bg-muted rounded"></div>
                    </div>
                    <div className="h-20 bg-muted rounded mb-4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header row with days */}
                <div className="grid grid-cols-[200px_1fr] gap-4">
                  <div className="font-medium">Członek zespołu</div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.length > 0 ? (
                      weekDays.map((day) => (
                        <div key={day.toISOString()} className="text-center text-sm font-medium">
                          <div>{format(day, 'EEE', { locale: pl })}</div>
                          <div>{format(day, 'd')}</div>
                        </div>
                      ))
                    ) : (
                      Array(7).fill(0).map((_, i) => (
                        <div key={i} className="text-center text-sm font-medium">
                          <div className="h-4 w-8 bg-muted/50 rounded mx-auto mb-1"></div>
                          <div className="h-4 w-4 bg-muted/50 rounded mx-auto"></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Workload rows */}
                {workloads.map((workload) => (
                  <div key={workload.user.id} className="grid grid-cols-[200px_1fr] gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={workload.user.image || ''} alt={workload.user.name} />
                          <AvatarFallback>{getInitials(workload.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{workload.user.name}</div>
                          <div className="text-xs text-muted-foreground">{workload.user.email}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Obciążenie pracą</span>
                          <span>{workload.completedTasks}/{workload.totalTasks} zadań</span>
                        </div>
                        <Progress
                          value={(workload.completedTasks / Math.max(workload.totalTasks, 1)) * 100}
                          className={cn(
                            getWorkloadColor(
                              workload.completedTasks / Math.max(workload.totalTasks, 1),
                              workload.overdueTasks
                            )
                          )}
                        />
                        <div className="flex space-x-2 text-xs">
                          {workload.overdueTasks > 0 && (
                            <div className="flex items-center text-red-500">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {workload.overdueTasks} zaległych
                            </div>
                          )}
                          {workload.upcomingTasks > 0 && (
                            <div className="flex items-center text-yellow-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {workload.upcomingTasks} nadchodzących
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.length > 0 ? (
                        weekDays.map((day) => {
                          try {
                            const dayTasks = getTasksForDay(workload.tasks, day);
                            const isOverdue = dayTasks.some(task => {
                              try {
                                if (!task.dueDate || task.status === 'DONE') return false;
                                const dueDate = new Date(task.dueDate);
                                return !isNaN(dueDate.getTime()) && dueDate < new Date();
                              } catch {
                                return false;
                              }
                            });

                            return (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  "p-2 rounded-md min-h-[80px] text-xs",
                                  dayTasks.length > 0
                                    ? "bg-muted/50 hover:bg-muted cursor-pointer"
                                    : "border border-dashed border-muted-foreground/20"
                                )}
                                onClick={() => dayTasks.length > 0 && router.push('/tasks')}
                              >
                                {dayTasks.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">{dayTasks.length} zadań</div>
                                    {dayTasks.slice(0, 2).map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex items-center space-x-1 truncate"
                                      >
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: task.project.color }}
                                        />
                                        <span className="truncate">{task.title}</span>
                                      </div>
                                    ))}
                                    {dayTasks.length > 2 && (
                                      <div className="text-muted-foreground">
                                        +{dayTasks.length - 2} więcej
                                      </div>
                                    )}
                                    {isOverdue && (
                                      <div className="text-red-500 flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Zaległe
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Brak zadań
                                  </div>
                                )}
                              </div>
                            );
                          } catch (error) {
                            console.error('Błąd podczas renderowania komórki dnia:', error);
                            return (
                              <div
                                key={`error-${day.getTime()}`}
                                className="p-2 rounded-md min-h-[80px] text-xs border border-dashed border-muted-foreground/20"
                              >
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  Błąd
                                </div>
                              </div>
                            );
                          }
                        })
                      ) : (
                        Array(7).fill(0).map((_, i) => (
                          <div
                            key={`placeholder-${i}`}
                            className="p-2 rounded-md min-h-[80px] text-xs border border-dashed border-muted-foreground/20"
                          >
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              Ładowanie...
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}