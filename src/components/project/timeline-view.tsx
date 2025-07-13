'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  format, 
  addDays, 
  differenceInDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  startDate?: string | null;
  assignedUsers: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
  subtasks?: Task[];
}

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState<Date[]>([]);
  const [timelineTasks, setTimelineTasks] = useState<Task[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate days for the current month plus 15 days before and after
    const start = subDays(startOfMonth(currentMonth), 15);
    const end = addDays(endOfMonth(currentMonth), 15);
    const monthDays = eachDayOfInterval({ start, end });
    setDays(monthDays);

    // Filter tasks with due dates
    const tasksWithDates = tasks.filter(task => task.dueDate);
    
    // Add start dates if not present (default to 3 days before due date)
    const enhancedTasks = tasksWithDates.map(task => {
      if (!task.startDate && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const startDate = addDays(dueDate, -3).toISOString();
        return { ...task, startDate };
      }
      return task;
    });

    setTimelineTasks(enhancedTasks);
  }, [tasks, currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getTaskColor = (status: string, priority: string) => {
    if (status === 'DONE') return 'bg-green-500';
    
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

  const subDays = (date: Date, amount: number) => {
    return addDays(date, -amount);
  };

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const startDate = task.startDate ? new Date(task.startDate) : addDays(dueDate, -3);
    
    // Find the index of the start and end dates in the days array
    const startIndex = days.findIndex(day => isSameDay(day, startDate));
    const endIndex = days.findIndex(day => isSameDay(day, dueDate));
    
    if (startIndex === -1 || endIndex === -1) return null;
    
    const left = `${(startIndex / days.length) * 100}%`;
    const width = `${((endIndex - startIndex + 1) / days.length) * 100}%`;
    
    return { left, width };
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto" ref={containerRef}>
          <div className="min-w-[1200px]">
            {/* Timeline header */}
            <div className="flex border-b">
              <div className="w-48 min-w-48 p-2 border-r bg-muted/50 font-medium">Task</div>
              <div className="flex-1 flex">
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'w-8 min-w-8 text-center text-xs py-2 border-r',
                      isWeekend(day) && 'bg-muted/30',
                      isToday(day) && 'bg-primary/10 font-bold'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>
            </div>

            {/* Month indicators */}
            <div className="flex border-b">
              <div className="w-48 min-w-48 p-2 border-r bg-muted/50 font-medium">
                Assignees
              </div>
              <div className="flex-1 flex">
                {days.map((day, index) => {
                  // Show month name on the first day of the month
                  const isFirstOfMonth = day.getDate() === 1;
                  // Or on the first day in our view
                  const isFirstDay = index === 0;
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'w-8 min-w-8 text-center text-xs py-1 border-r',
                        isWeekend(day) && 'bg-muted/30',
                        isToday(day) && 'bg-primary/10'
                      )}
                    >
                      {(isFirstOfMonth || isFirstDay) && (
                        <span className="text-[8px] text-muted-foreground">
                          {format(day, 'MMM')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tasks */}
            {timelineTasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No tasks with due dates to display
              </div>
            ) : (
              timelineTasks.map((task) => {
                const position = getTaskPosition(task);
                
                return (
                  <div key={task.id} className="flex border-b relative">
                    <div 
                      className="w-48 min-w-48 p-2 border-r flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => onTaskClick(task.id)}
                    >
                      <div className="truncate">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.status === 'TODO'
                            ? 'To Do'
                            : task.status === 'IN_PROGRESS'
                            ? 'In Progress'
                            : task.status === 'REVIEW'
                            ? 'Review'
                            : 'Done'}
                        </div>
                      </div>
                      {task.assignedUsers && task.assignedUsers.length > 0 && (
                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {task.assignedUsers.map((assignment) => (
                            <Avatar key={assignment.user.id} className="h-6 w-6 ring-2 ring-background">
                              <AvatarImage src={assignment.user.image || ''} alt={assignment.user.name} />
                              <AvatarFallback className="text-xs">
                                {getInitials(assignment.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 h-12 relative">
                      {position && (
                        <div
                          className={cn(
                            'absolute h-6 top-3 rounded-md cursor-pointer',
                            getTaskColor(task.status, task.priority)
                          )}
                          style={{
                            left: position.left,
                            width: position.width,
                          }}
                          onClick={() => onTaskClick(task.id)}
                        >
                          <div className="px-2 py-1 text-xs text-white truncate">
                            {task.title}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
