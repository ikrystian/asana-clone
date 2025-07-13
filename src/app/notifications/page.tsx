'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Users,
  Calendar,
  CheckCheck,
  Trash2,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'comment_mention' | 'due_date' | 'project_update' | 'team_joined';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data: {
    taskId?: string;
    projectId?: string;
    commentId?: string;
    userId?: string;
  };
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać powiadomień');
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Błąd podczas pobierania powiadomień:', error);
      toast.error('Nie udało się załadować powiadomień');
      
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'task_assigned',
          title: 'Zadanie przypisane',
          message: 'Jan Kowalski przypisał Ci zadanie: "Ukończ propozycję projektu"',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          read: false,
          data: {
            taskId: 'task-1',
            userId: 'user-1',
          },
          user: {
            id: 'user-1',
            name: 'Jan Kowalski',
            image: null,
          },
        },
        {
          id: '2',
          type: 'comment_mention',
          title: 'Wzmianka w komentarzu',
          message: 'Anna Nowak wspomniała o Tobie w komentarzu: "Czy @możesz to sprawdzić do jutra?"',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: false,
          data: {
            taskId: 'task-2',
            commentId: 'comment-1',
            userId: 'user-2',
          },
          user: {
            id: 'user-2',
            name: 'Anna Nowak',
            image: null,
          },
        },
        {
          id: '3',
          type: 'due_date',
          title: 'Zbliżający się termin zadania',
          message: 'Zadanie "Zaktualizuj treść strony internetowej" ma termin jutro',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          read: true,
          data: {
            taskId: 'task-3',
          },
        },
        {
          id: '4',
          type: 'task_completed',
          title: 'Zadanie ukończone',
          message: 'Piotr Wiśniewski ukończył zadanie: "Zaprojektuj nowe logo"',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          read: true,
          data: {
            taskId: 'task-4',
            userId: 'user-3',
          },
          user: {
            id: 'user-3',
            name: 'Piotr Wiśniewski',
            image: null,
          },
        },
        {
          id: '5',
          type: 'project_update',
          title: 'Aktualizacja projektu',
          message: 'Projekt "Przeprojektowanie strony internetowej" został zaktualizowany o nowe zadania',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          read: true,
          data: {
            projectId: 'project-1',
          },
        },
        {
          id: '6',
          type: 'team_joined',
          title: 'Nowy członek zespołu',
          message: 'Alicja Wójcik dołączyła do zespołu',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          read: true,
          data: {
            userId: 'user-4',
          },
          user: {
            id: 'user-4',
            name: 'Alicja Wójcik',
            image: null,
          },
        },
      ];
      
      setNotifications(mockNotifications);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update UI
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // In a real app, this would be an API call
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się oznaczyć powiadomienia jako przeczytane');
      }
    } catch (error) {
      console.error('Błąd podczas oznaczania powiadomienia jako przeczytane:', error);
      toast.error('Nie udało się oznaczyć powiadomienia jako przeczytane');
      
      // Revert the optimistic update
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setIsMarkingAllRead(true);
    
    try {
      // Optimistically update UI
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // In a real app, this would be an API call
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się oznaczyć wszystkich powiadomień jako przeczytane');
      }
      
      toast.success('Wszystkie powiadomienia zostały oznaczone jako przeczytane');
    } catch (error) {
      console.error('Błąd podczas oznaczania wszystkich powiadomień jako przeczytane:', error);
      toast.error('Nie udało się oznaczyć wszystkich powiadomień jako przeczytane');
      
      // Revert the optimistic update
      fetchNotifications();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Optimistically update UI
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // In a real app, this would be an API call
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się usunąć powiadomienia');
      }
      
      toast.success('Powiadomienie usunięte');
    } catch (error) {
      console.error('Błąd podczas usuwania powiadomienia:', error);
      toast.error('Nie udało się usunąć powiadomienia');
      
      // Revert the optimistic update
      fetchNotifications();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'task_assigned' || notification.type === 'task_completed' || notification.type === 'due_date') {
      if (notification.data.taskId) {
        router.push(`/tasks/${notification.data.taskId}`);
      }
    } else if (notification.type === 'comment_mention') {
      if (notification.data.taskId) {
        router.push(`/tasks/${notification.data.taskId}?comment=${notification.data.commentId}`);
      }
    } else if (notification.type === 'project_update') {
      if (notification.data.projectId) {
        router.push(`/projects/${notification.data.projectId}`);
      }
    } else if (notification.type === 'team_joined') {
      router.push('/team');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'comment_mention':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'due_date':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'project_update':
        return <Calendar className="h-5 w-5 text-indigo-500" />;
      case 'team_joined':
        return <Users className="h-5 w-5 text-teal-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">Powiadomienia</h1>
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary">{unreadCount} nowe</Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              disabled={isMarkingAllRead || unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Oznacz wszystkie jako przeczytane
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ustawienia powiadomień
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-7 w-full">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Wszystkie
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm">
              Nieprzeczytane
            </TabsTrigger>
            <TabsTrigger value="task_assigned" className="text-xs sm:text-sm">
              Przypisane
            </TabsTrigger>
            <TabsTrigger value="task_completed" className="text-xs sm:text-sm">
              Ukończone
            </TabsTrigger>
            <TabsTrigger value="comment_mention" className="text-xs sm:text-sm">
              Wzmianki
            </TabsTrigger>
            <TabsTrigger value="due_date" className="text-xs sm:text-sm">
              Zbliżające się
            </TabsTrigger>
            <TabsTrigger value="project_update" className="text-xs sm:text-sm">
              Aktualizacje
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  {activeTab === 'all' && 'Wszystkie powiadomienia'}
                  {activeTab === 'unread' && 'Nieprzeczytane powiadomienia'}
                  {activeTab === 'task_assigned' && 'Przypisania zadań'}
                  {activeTab === 'task_completed' && 'Ukończone zadania'}
                  {activeTab === 'comment_mention' && 'Wzmianki w komentarzach'}
                  {activeTab === 'due_date' && 'Przypomnienia o terminach'}
                  {activeTab === 'project_update' && 'Aktualizacje projektów'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 border rounded-md animate-pulse">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-1/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Brak powiadomień</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all'
                        ? 'Nie masz obecnie żadnych powiadomień'
                        : activeTab === 'unread'
                        ? 'Nie masz nieprzeczytanych powiadomień'
                        : `Nie masz powiadomień typu ${activeTab.replace('_', ' ')}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start p-4 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                          !notification.read && "bg-muted/30 border-l-4 border-l-primary"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 mr-4">
                          {notification.user ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notification.user.image || ''} alt={notification.user.name} />
                              <AvatarFallback>{getInitials(notification.user.name)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={cn(
                              "text-sm font-medium",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: pl })}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                    >
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="19" cy="12" r="1" />
                                      <circle cx="5" cy="12" r="1" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.read && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Oznacz jako przeczytane
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), 'd MMM, yyyy • HH:mm', { locale: pl })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}