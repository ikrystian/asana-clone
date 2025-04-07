'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, MessageSquare, Paperclip } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  _count?: {
    comments: number;
    attachments: number;
  };
}

interface Section {
  id: string;
  name: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  projectId: string;
  initialTasks: Task[];
  sections: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  onCreateTask: (sectionId: string) => void;
  onTaskClick: (taskId: string) => void;
}

export function KanbanBoard({ projectId, initialTasks, sections, onCreateTask, onTaskClick }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize columns with sections and tasks
  useEffect(() => {
    const boardColumns = sections.map((section) => {
      const sectionTasks = initialTasks.filter((task) => task.sectionId === section.id);
      return {
        id: section.id,
        name: section.name,
        tasks: sectionTasks,
      };
    });

    // Add tasks without a section to the first column
    const tasksWithoutSection = initialTasks.filter((task) => !task.sectionId);
    if (boardColumns.length > 0 && tasksWithoutSection.length > 0) {
      boardColumns[0].tasks = [...boardColumns[0].tasks, ...tasksWithoutSection];
    }

    setColumns(boardColumns);
  }, [initialTasks, sections]);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the source and destination columns
    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Create new columns array
    const newColumns = [...columns];

    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceColumn.tasks);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);

      const newColumn = {
        ...sourceColumn,
        tasks: newTasks,
      };

      const columnIndex = newColumns.findIndex((col) => col.id === source.droppableId);
      newColumns[columnIndex] = newColumn;
    } else {
      // Moving from one column to another
      const sourceTasks = Array.from(sourceColumn.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      const destTasks = Array.from(destColumn.tasks);
      destTasks.splice(destination.index, 0, movedTask);

      const sourceIndex = newColumns.findIndex((col) => col.id === source.droppableId);
      const destIndex = newColumns.findIndex((col) => col.id === destination.droppableId);

      newColumns[sourceIndex] = {
        ...sourceColumn,
        tasks: sourceTasks,
      };

      newColumns[destIndex] = {
        ...destColumn,
        tasks: destTasks,
      };

      // Update task status in the backend
      setLoading(true);
      try {
        const response = await fetch(`/api/tasks/${draggableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sectionId: destination.droppableId,
            status: getStatusFromSectionName(destColumn.name),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task');
        }
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task status');
      } finally {
        setLoading(false);
      }
    }

    setColumns(newColumns);
  };

  const getStatusFromSectionName = (sectionName: string): string => {
    const name = sectionName.toUpperCase();
    if (name.includes('TODO') || name.includes('TO DO') || name.includes('BACKLOG')) {
      return 'TODO';
    } else if (name.includes('PROGRESS') || name.includes('DOING')) {
      return 'IN_PROGRESS';
    } else if (name.includes('REVIEW')) {
      return 'REVIEW';
    } else if (name.includes('DONE') || name.includes('COMPLETE')) {
      return 'DONE';
    }
    return 'TODO';
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

  return (
    <div className="h-full overflow-x-auto pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-full" style={{ minHeight: '70vh' }}>
          {columns.map((column) => (
            <div key={column.id} className="w-72 flex-shrink-0">
              <div className="bg-muted rounded-t-md p-3 font-medium">
                <div className="flex justify-between items-center">
                  <span>{column.name}</span>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-muted/50 rounded-b-md p-2 min-h-[500px]"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2 cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => onTaskClick(task.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <div className={`w-1 h-full rounded-full ${getPriorityColor(task.priority)}`} />
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm">{task.title}</h3>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                {task.assignee ? (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={task.assignee.image || ''} alt={task.assignee.name} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(task.assignee.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="w-6" />
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  {task.dueDate && (
                                    <div className="flex items-center text-xs">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  {task._count?.comments > 0 && (
                                    <div className="flex items-center text-xs">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      {task._count.comments}
                                    </div>
                                  )}
                                  {task._count?.attachments > 0 && (
                                    <div className="flex items-center text-xs">
                                      <Paperclip className="h-3 w-3 mr-1" />
                                      {task._count.attachments}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-muted-foreground"
                      onClick={() => onCreateTask(column.id)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add task
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
