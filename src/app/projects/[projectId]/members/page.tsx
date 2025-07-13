'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
  };
  members: ProjectMember[];
}

export default function ProjectMembersPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const { projectId } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        setIsLoading(true);
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project members:', error);
        toast.error('Failed to load project members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMember(true);
    try {
      // First, find the user by email
      const userSearchResponse = await fetch(`/api/users?email=${newMemberEmail}`);
      if (!userSearchResponse.ok) {
        throw new Error('User not found or error searching user');
      }
      const users = await userSearchResponse.json();
      if (!users || users.length === 0) {
        throw new Error('User not found');
      }
      const userId = users[0].id;

      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      const newMember = await response.json();
      setProject((prevProject) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          members: [...prevProject.members, newMember],
        };
      });
      toast.success('Member added successfully');
      setNewMemberEmail('');
      setAddMemberDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error adding member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members?userId=${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      setProject((prevProject) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          members: prevProject.members.filter((member) => member.user.id !== memberId),
        };
      });
      toast.success('Member removed successfully');
    } catch (error: unknown) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            The project you are looking for does not exist or you do not have access to it.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name} Members</h1>
            <p className="text-muted-foreground mt-1">Manage who has access to this project.</p>
          </div>
          <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the user you want to add to this project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddMemberDialogOpen(false)}
                    type="button"
                    disabled={isAddingMember}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddingMember}>
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Members</CardTitle>
          </CardHeader>
          <CardContent>
            {project.members.length === 0 ? (
              <p className="text-muted-foreground">No members yet. Add your first member!</p>
            ) : (
              <div className="space-y-4">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      {project.owner.id !== member.user.id && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveMember(member.user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
