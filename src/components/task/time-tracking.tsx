'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, formatDistance } from 'date-fns';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

interface TimeEntry {
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
}

interface TimeTrackingProps {
  taskId: string;
  initialTimeEntries: TimeEntry[];
}

export function TimeTracking({ taskId, initialTimeEntries }: TimeTrackingProps) {
  const { data: session } = useSession();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [isTracking, setIsTracking] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [description, setDescription] = useState('');
  const [timer, setTimer] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if there's an active time entry on load
  useEffect(() => {
    const active = timeEntries.find(entry => !entry.endTime);
    if (active) {
      setIsTracking(true);
      setActiveEntry(active);
      setDescription(active.description || '');
      
      // Calculate elapsed time
      const startTime = new Date(active.startTime).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(elapsed);
    }
  }, [timeEntries]);

  // Update timer every second when tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTracking = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          startTime: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start time tracking');
      }
      
      const newEntry = await response.json();
      
      setTimeEntries(prev => [...prev, newEntry]);
      setIsTracking(true);
      setActiveEntry(newEntry);
      setTimer(0);
      
      toast.success('Time tracking started');
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast.error('Failed to start time tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async () => {
    if (!activeEntry) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/${activeEntry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          description,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop time tracking');
      }
      
      const updatedEntry = await response.json();
      
      setTimeEntries(prev => 
        prev.map(entry => 
          entry.id === activeEntry.id ? updatedEntry : entry
        )
      );
      setIsTracking(false);
      setActiveEntry(null);
      setDescription('');
      
      toast.success('Time tracking stopped');
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast.error('Failed to stop time tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeEntry = async (manualEntry: { description: string, duration: number }) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (manualEntry.duration * 1000));
      
      const response = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: manualEntry.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add time entry');
      }
      
      const newEntry = await response.json();
      
      setTimeEntries(prev => [...prev, newEntry]);
      setIsAddDialogOpen(false);
      
      toast.success('Time entry added');
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast.error('Failed to add time entry');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTimeEntry = async (entryId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-entries/${entryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete time entry');
      }
      
      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      toast.success('Time entry deleted');
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast.error('Failed to delete time entry');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalTime = () => {
    return timeEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      } else if (entry.endTime) {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        return total + Math.floor((end - start) / 1000);
      } else if (entry.id === activeEntry?.id) {
        return total + timer;
      }
      return total;
    }, 0);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Time Tracking</span>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Time
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current timer */}
        <div className="bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <div className="font-mono text-xl font-bold">
              {formatTime(timer)}
            </div>
            <Button 
              variant={isTracking ? "destructive" : "default"} 
              size="sm"
              onClick={isTracking ? stopTracking : startTracking}
              disabled={isLoading}
            >
              {isTracking ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </>
              )}
            </Button>
          </div>
          <Input
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Time entries list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {timeEntries.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              No time entries yet
            </div>
          ) : (
            timeEntries
              .filter(entry => entry.id !== activeEntry?.id) // Don't show active entry
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .map(entry => (
                <div 
                  key={entry.id} 
                  className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.user.image || ''} alt={entry.user.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(entry.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {entry.description || 'No description'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(entry.startTime), 'MMM d, h:mm a')}
                        {entry.endTime && ` - ${format(new Date(entry.endTime), 'h:mm a')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="font-mono text-sm">
                      {entry.duration 
                        ? formatTime(entry.duration)
                        : entry.endTime 
                          ? formatTime(Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000))
                          : '00:00:00'
                      }
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => deleteTimeEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Total time */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm font-medium">Total Time</div>
          <div className="font-mono text-sm font-bold">
            {formatTime(getTotalTime())}
          </div>
        </div>

        {/* Add time entry dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
              <DialogDescription>
                Manually add time spent on this task
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input 
                  id="description" 
                  placeholder="What did you work on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hours</label>
                  <Input 
                    id="hours" 
                    type="number" 
                    min="0"
                    defaultValue="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minutes</label>
                  <Input 
                    id="minutes" 
                    type="number" 
                    min="0"
                    max="59"
                    defaultValue="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seconds</label>
                  <Input 
                    id="seconds" 
                    type="number" 
                    min="0"
                    max="59"
                    defaultValue="0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const hours = parseInt((document.getElementById('hours') as HTMLInputElement).value) || 0;
                  const minutes = parseInt((document.getElementById('minutes') as HTMLInputElement).value) || 0;
                  const seconds = parseInt((document.getElementById('seconds') as HTMLInputElement).value) || 0;
                  const duration = hours * 3600 + minutes * 60 + seconds;
                  
                  if (duration <= 0) {
                    toast.error('Please enter a valid time');
                    return;
                  }
                  
                  addTimeEntry({
                    description,
                    duration,
                  });
                }}
                disabled={isLoading}
              >
                Add Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
