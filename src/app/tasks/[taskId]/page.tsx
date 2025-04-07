'use client';

import { useEffect, useState, useRef, use } from 'react';
import { CustomFields } from '@/components/task/custom-fields';
import { TimeTracking } from '@/components/task/time-tracking';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Flag,
  MessageSquare,
  Paperclip,
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  PlusSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    color: string;
  };
  section: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  parentTask: {
    id: string;
    title: string;
  } | null;
  subtasks: Array<{
    id: string;
    title: string;
    status: string;
    assignee: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  timeEntries?: Array<{
    id: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    duration: number | null;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
  customFields?: Array<{
    id: string;
    name: string;
    type: string;
    options?: string;
    required: boolean;
  }>;
  customFieldValues?: Array<{
    id: string;
    value: string;
    fieldId: string;
    field: {
      id: string;
      name: string;
      type: string;
      options?: string;
      required: boolean;
    };
  }>;
}

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const commentForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Unwrap params outside of try/catch
  const resolvedParams = use(params);
  const taskId = resolvedParams.taskId;

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);

        // Fetch task details
        const taskResponse = await fetch(`/api/tasks/${taskId}`);
        if (!taskResponse.ok) {
          throw new Error('Failed to fetch task');
        }
        const taskData = await taskResponse.json();
        setTask(taskData);
      } catch (error) {
        console.error('Error fetching task data:', error);
        toast.error('Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  useEffect(() => {
    // Scroll to bottom of comments when new comments are added
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [task?.comments]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const updatedTask = await response.json();
      setTask(updatedTask);

      toast.success(`Task marked as ${newStatus === 'DONE' ? 'complete' : newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleSubtaskStatusChange = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: completed ? 'DONE' : 'TODO',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subtask status');
      }

      // Update the task in the UI
      setTask((prevTask) => {
        if (!prevTask) return null;

        return {
          ...prevTask,
          subtasks: prevTask.subtasks.map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, status: completed ? 'DONE' : 'TODO' }
              : subtask
          ),
        };
      });

      toast.success(`Subtask marked as ${completed ? 'complete' : 'incomplete'}`);
    } catch (error) {
      console.error('Error updating subtask status:', error);
      toast.error('Failed to update subtask status');
    }
  };

  const onSubmitComment = async (data: CommentFormValues) => {
    if (!task) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();

      // Update the task with the new comment
      setTask((prevTask) => {
        if (!prevTask) return null;

        return {
          ...prevTask,
          comments: [...prevTask.comments, newComment],
        };
      });

      // Reset the form
      commentForm.reset();

      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast.success('Task deleted successfully');
      router.push(task.project ? `/projects/${task.project.id}` : '/dashboard');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

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
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40 md:col-span-2" />
            </div>
          </div>
        ) : task ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.back()}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Task Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(task.project ? `/projects/${task.project.id}/tasks/new?parentId=${task.id}` : `/dashboard?parentId=${task.id}`)}>
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Add Subtask
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                {task.project && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                )}
                {task.project ? (
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {task.project.name}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">No project</span>
                )}
                {task.parentTask && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <Link
                      href={`/tasks/${task.parentTask.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {task.parentTask.title}
                    </Link>
                  </>
                )}
              </div>

              <h1 className="text-2xl font-bold mb-4">{task.title}</h1>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge
                  variant={task.status === 'DONE' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleStatusChange(task.status === 'DONE' ? 'TODO' : 'DONE')}
                >
                  {task.status === 'TODO' ? 'To Do' :
                   task.status === 'IN_PROGRESS' ? 'In Progress' :
                   task.status === 'REVIEW' ? 'Review' : 'Done'}
                </Badge>

                <Badge
                  variant="outline"
                  className={`${
                    task.priority === 'LOW' ? 'border-blue-500 text-blue-500' :
                    task.priority === 'MEDIUM' ? 'border-green-500 text-green-500' :
                    task.priority === 'HIGH' ? 'border-orange-500 text-orange-500' :
                    'border-red-500 text-red-500'
                  }`}
                >
                  {task.priority} Priority
                </Badge>

                {task.dueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 text-xs">
                            {task.status === 'TODO' ? 'To Do' :
                             task.status === 'IN_PROGRESS' ? 'In Progress' :
                             task.status === 'REVIEW' ? 'Review' : 'Done'}
                            <ChevronLeft className="ml-1 h-3 w-3 rotate-270" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange('TODO')}>
                            To Do
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
                            In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange('REVIEW')}>
                            Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange('DONE')}>
                            Done
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Assignee</span>
                      <div>
                        {task.assignee ? (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={task.assignee.image || ''} alt={task.assignee.name} />
                              <AvatarFallback>{getInitials(task.assignee.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 text-xs">
                            Unassigned
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <div>
                        {task.dueDate ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 text-xs">
                            No due date
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Created by</span>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={task.creator.image || ''} alt={task.creator.name} />
                          <AvatarFallback>{getInitials(task.creator.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.creator.name}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm">
                        {format(new Date(task.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {task.subtasks && task.subtasks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Subtasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {task.subtasks.map((subtask) => (
                          <li key={subtask.id} className="flex items-start">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 mr-2 mt-0.5"
                              onClick={() => handleSubtaskStatusChange(subtask.id, subtask.status !== 'DONE')}
                            >
                              {subtask.status === 'DONE' ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex-1">
                              <Link
                                href={`/tasks/${subtask.id}`}
                                className={`text-sm hover:underline ${
                                  subtask.status === 'DONE' ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {subtask.title}
                              </Link>
                              {subtask.assignee && (
                                <div className="flex items-center mt-1">
                                  <Avatar className="h-4 w-4 mr-1">
                                    <AvatarImage src={subtask.assignee.image || ''} alt={subtask.assignee.name} />
                                    <AvatarFallback className="text-[8px]">{getInitials(subtask.assignee.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">{subtask.assignee.name}</span>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => router.push(task.project ? `/projects/${task.project.id}/tasks/new?parentId=${task.id}` : `/dashboard?parentId=${task.id}`)}
                      >
                        <PlusSquare className="mr-1 h-3 w-3" />
                        Add Subtask
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {task.attachments && task.attachments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {task.attachments.map((attachment) => (
                          <li key={attachment.id} className="flex items-center">
                            <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div className="flex-1">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                              >
                                {attachment.name}
                              </a>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <TimeTracking
                  taskId={taskId}
                  initialTimeEntries={task.timeEntries || []}
                />

                {task.project && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Custom Fields</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CustomFields
                        taskId={taskId}
                        projectId={task.project.id}
                        customFields={task.customFields || []}
                        customFieldValues={task.customFieldValues || []}
                        onAddField={() => router.push(`/projects/${task.project.id}/settings/fields`)}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {task.description ? (
                      <div className="prose prose-sm max-w-none">
                        {task.description.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No description provided</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                      {!task.comments || task.comments.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          No comments yet
                        </p>
                      ) : (
                        task.comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.image || ''} alt={comment.author.name} />
                              <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              <div className="mt-1 text-sm">
                                {comment.content.split('\n').map((line, i) => (
                                  <p key={i}>{line}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={commentsEndRef} />
                    </div>

                    {session?.user && (
                      <Form {...commentForm}>
                        <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="space-y-2">
                          <FormField
                            control={commentForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder="Add a comment..."
                                    className="min-h-[80px]"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" size="sm" disabled={isSubmittingComment}>
                              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Task</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone
                    and all subtasks, comments, and attachments will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteTask}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Task not found</h2>
            <p className="text-muted-foreground mb-4">
              The task you are looking for does not exist or you do not have access to it.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
