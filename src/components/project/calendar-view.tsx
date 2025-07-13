'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedUsers: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onCreateTask: (date: Date) => void;
}

export function CalendarView({ tasks, onTaskClick, onCreateTask }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  }, [currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy', { locale: pl })}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'].map((day) => (
          <div key={day} className="text-center font-medium text-sm py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before the start of the month */}
        {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-32 bg-muted/30 rounded-md"></div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'h-32 bg-muted/30 rounded-md p-2 overflow-hidden',
                isToday && 'ring-2 ring-primary'
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
                  {format(day, 'd')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onCreateTask(day)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-card p-1 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onTaskClick(task.id)}
                  >
                    <div className="flex items-center gap-1">
                      <div className={`w-1 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {task.assignedUsers && task.assignedUsers.length > 0 ? (
                        <div className="flex items-center -space-x-1 overflow-hidden">
                          {task.assignedUsers.map((assignment) => (
                            <Avatar key={assignment.user.id} className="h-4 w-4 ring-1 ring-background">
                              <AvatarImage src={assignment.user.image || ''} alt={assignment.user.name} />
                              <AvatarFallback className="text-[8px]">
                                {getInitials(assignment.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      ) : (
                        <div className="w-4" />
                      )}
                      <Badge
                        variant="outline"
                        className="text-[8px] h-4 px-1 rounded-sm"
                      >
                        <div className={`w-1 h-1 rounded-full ${getStatusColor(task.status)} mr-1`} />
                        {task.status === 'TODO'
                          ? 'Do zrobienia'
                          : task.status === 'IN_PROGRESS'
                          ? 'W toku'
                          : task.status === 'REVIEW'
                          ? 'Recenzja'
                          : 'Zakończone'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty cells for days after the end of the month */}
        {Array.from({ length: 6 - (calendarDays[calendarDays.length - 1]?.getDay() || 0) }).map(
          (_, index) => (
            <div key={`empty-end-${index}`} className="h-32 bg-muted/30 rounded-md"></div>
          )
        )}
      </div>
    </div>
  );
}