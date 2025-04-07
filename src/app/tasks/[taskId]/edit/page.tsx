'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function EditTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Unwrap params outside of try/catch
  const resolvedParams = use(params);
  const taskId = resolvedParams.taskId;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeId: null,
      sectionId: null,
      parentTaskId: null,
    },
  });

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch task details
        const taskResponse = await fetch(`/api/tasks/${taskId}`);
        if (!taskResponse.ok) {
          throw new Error('Failed to fetch task');
        }
        const taskData = await taskResponse.json();
        
        // Set form values
        form.setValue('title', taskData.title);
        form.setValue('description', taskData.description || '');
        form.setValue('status', taskData.status);
        form.setValue('priority', taskData.priority);
        form.setValue('assigneeId', taskData.assignee?.id || null);
        form.setValue('sectionId', taskData.section?.id || null);
        form.setValue('parentTaskId', taskData.parentTask?.id || null);
        
        if (taskData.dueDate) {
          form.setValue('dueDate', new Date(taskData.dueDate));
        }
        
        // Fetch project details if available
        if (taskData.project) {
          const projectResponse = await fetch(`/api/projects/${taskData.project.id}`);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            setProject(projectData);
          }
          
          // Fetch project tasks for parent task selection
          const tasksResponse = await fetch(`/api/projects/${taskData.project.id}/tasks`);
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            // Filter out the current task and its subtasks to avoid circular references
            const filteredTasks = tasksData.filter((t: any) => 
              t.id !== taskId && 
              (!t.parentTask || t.parentTask.id !== taskId)
            );
            setTasks(filteredTasks);
          }
        }
        
        // Fetch users for assignee selection
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching task data:', error);
        toast.error('Failed to load task data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchTaskData();
  }, [taskId, form]);

  async function onSubmit(data: TaskFormValues) {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to update task');
        return;
      }

      toast.success('Task updated successfully!');
      router.push(`/tasks/${taskId}`);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-4">Edit Task</h1>
        </div>

        {isLoadingData ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-10 w-32 ml-auto" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Task description"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="REVIEW">Review</SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>No due date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                              <div className="p-2 border-t border-border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => field.onChange(null)}
                                >
                                  Clear date
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assigneeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignee</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "unassigned"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex items-center">
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={user.image || ''} alt={user.name} />
                                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    {user.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {project && project.sections && project.sections.length > 0 && (
                      <FormField
                        control={form.control}
                        name="sectionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No section</SelectItem>
                                {project.sections.map((section: any) => (
                                  <SelectItem key={section.id} value={section.id}>
                                    {section.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {tasks.length > 0 && (
                      <FormField
                        control={form.control}
                        name="parentTaskId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Task</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select parent task" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No parent task</SelectItem>
                                {tasks.map((task) => (
                                  <SelectItem key={task.id} value={task.id}>
                                    {task.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Optional parent task for this task
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/tasks/${taskId}`)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
