'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  BarChart2,
  Users,
  UserPlus,
  Filter
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role?: string;
  department?: string;
  projects: {
    id: string;
    name: string;
    color: string;
  }[];
  assignedTasks: number;
  completedTasks: number;
}

export default function TeamPage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (teamMembers.length > 0) {
      filterMembers();
    }
  }, [teamMembers, searchQuery, departmentFilter]);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team');
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać członków zespołu');
      }
      
      const data = await response.json();
      setTeamMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.error('Błąd podczas pobierania członków zespołu:', error);
      toast.error('Nie udało się załadować członków zespołu');
      
      // Mock data for demonstration
      const mockTeamMembers = [
        {
          id: '1',
          name: 'Jan Kowalski',
          email: 'jan@example.com',
          image: null,
          role: 'Menedżer produktu',
          department: 'Produkt',
          projects: [
            { id: 'p1', name: 'Kampania marketingowa', color: '#4299E1' },
            { id: 'p2', name: 'Przeprojektowanie strony internetowej', color: '#48BB78' },
          ],
          assignedTasks: 12,
          completedTasks: 8,
        },
        {
          id: '2',
          name: 'Anna Nowak',
          email: 'anna@example.com',
          image: null,
          role: 'Projektant UX',
          department: 'Projekt',
          projects: [
            { id: 'p2', name: 'Przeprojektowanie strony internetowej', color: '#48BB78' },
            { id: 'p3', name: 'Aplikacja mobilna', color: '#ED8936' },
          ],
          assignedTasks: 15,
          completedTasks: 10,
        },
        {
          id: '3',
          name: 'Piotr Wiśniewski',
          email: 'piotr@example.com',
          image: null,
          role: 'Programista frontend',
          department: 'Inżynieria',
          projects: [
            { id: 'p2', name: 'Przeprojektowanie strony internetowej', color: '#48BB78' },
            { id: 'p4', name: 'Integracja API', color: '#9F7AEA' },
          ],
          assignedTasks: 18,
          completedTasks: 14,
        },
        {
          id: '4',
          name: 'Alicja Wójcik',
          email: 'alicja@example.com',
          image: null,
          role: 'Strateg treści',
          department: 'Marketing',
          projects: [
            { id: 'p1', name: 'Kampania marketingowa', color: '#4299E1' },
            { id: 'p5', name: 'Kalendarz treści', color: '#F56565' },
          ],
          assignedTasks: 10,
          completedTasks: 7,
        },
        {
          id: '5',
          name: 'Karol Lewandowski',
          email: 'karol@example.com',
          image: null,
          role: 'Programista backend',
          department: 'Inżynieria',
          projects: [
            { id: 'p4', name: 'Integracja API', color: '#9F7AEA' },
            { id: 'p6', name: 'Migracja bazy danych', color: '#667EEA' },
          ],
          assignedTasks: 14,
          completedTasks: 9,
        },
      ];
      
      setTeamMembers(mockTeamMembers);
      setFilteredMembers(mockTeamMembers);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...teamMembers];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(member => member.department === departmentFilter);
    }
    
    setFilteredMembers(filtered);
  };

  const handleInviteTeamMember = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Wprowadź prawidłowy adres e-mail');
      return;
    }
    
    setIsInviting(true);
    
    try {
      // In a real app, this would be an API call to send an invitation
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Zaproszenie wysłane do ${inviteEmail}`);
      setInviteDialogOpen(false);
      setInviteEmail('');
    } catch (error) {
      console.error('Błąd podczas zapraszania członka zespołu:', error);
      toast.error('Nie udało się wysłać zaproszenia');
    } finally {
      setIsInviting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getCompletionRate = (completed: number, assigned: number) => {
    return assigned > 0 ? (completed / assigned) * 100 : 0;
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDepartments = () => {
    const departments = new Set<string>();
    teamMembers.forEach(member => {
      if (member.department) {
        departments.add(member.department);
      }
    });
    return Array.from(departments);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Zespół</h1>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Zaproś członka zespołu
          </Button>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj członków zespołu..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Dział</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie działy</SelectItem>
                {getDepartments().map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">
              <Users className="h-4 w-4 mr-2" />
              Widok siatki
            </TabsTrigger>
            <TabsTrigger value="list">
              <BarChart2 className="h-4 w-4 mr-2" />
              Widok listy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nie znaleziono członków zespołu</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-4">
                    {searchQuery || departmentFilter !== 'all'
                      ? 'Spróbuj dostosować filtry, aby zobaczyć więcej członków zespołu'
                      : 'Zaproś członków zespołu do współpracy przy projektach'}
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Zaproś członka zespołu
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.image || ''} alt={member.name} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">{member.role || 'Członek zespołu'}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{member.email}</span>
                        </div>
                        
                        {member.department && (
                          <div className="flex items-center">
                            <Badge variant="outline">{member.department}</Badge>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Projekty</div>
                          <div className="flex flex-wrap gap-2">
                            {member.projects.map((project) => (
                              <div 
                                key={project.id}
                                className="flex items-center space-x-1 text-xs bg-muted/50 px-2 py-1 rounded-md"
                                onClick={() => router.push(`/projects/${project.id}`)}
                              >
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: project.color }}
                                />
                                <span>{project.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Ukończenie zadań</span>
                            <span>{member.completedTasks}/{member.assignedTasks} zadań</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                getCompletionColor(getCompletionRate(member.completedTasks, member.assignedTasks))
                              )}
                              style={{ 
                                width: `${getCompletionRate(member.completedTasks, member.assignedTasks)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Członkowie zespołu ({filteredMembers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-md animate-pulse">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-3 w-1/6" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    ))}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nie znaleziono członków zespołu</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || departmentFilter !== 'all'
                        ? 'Spróbuj dostosować filtry, aby zobaczyć więcej członków zespołu'
                        : 'Zaproś członków zespołu do współpracy przy projektach'}
                    </p>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Zaproś członka zespołu
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Imię i nazwisko</th>
                          <th className="text-left py-3 px-4 font-medium">Rola</th>
                          <th className="text-left py-3 px-4 font-medium">Dział</th>
                          <th className="text-left py-3 px-4 font-medium">Projekty</th>
                          <th className="text-left py-3 px-4 font-medium">Zadania</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((member) => (
                          <tr key={member.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.image || ''} alt={member.name} />
                                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.name}</div>
                                  <div className="text-xs text-muted-foreground">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">{member.role || 'Członek zespołu'}</td>
                            <td className="py-3 px-4">
                              {member.department && (
                                <Badge variant="outline">{member.department}</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {member.projects.slice(0, 2).map((project) => (
                                  <div 
                                    key={project.id}
                                    className="flex items-center space-x-1 text-xs bg-muted/50 px-2 py-1 rounded-md"
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <span>{project.name}</span>
                                  </div>
                                ))}
                                {member.projects.length > 2 && (
                                  <div className="text-xs text-muted-foreground px-2 py-1">
                                    +{member.projects.length - 2} więcej
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      getCompletionColor(getCompletionRate(member.completedTasks, member.assignedTasks))
                                    )}
                                    style={{ 
                                      width: `${getCompletionRate(member.completedTasks, member.assignedTasks)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-xs">
                                  {member.completedTasks}/{member.assignedTasks}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zaproś członka zespołu</DialogTitle>
            <DialogDescription>
              Wyślij zaproszenie do współpracy przy projektach.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adres e-mail</label>
              <Input 
                type="email" 
                placeholder="kolega@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setInviteDialogOpen(false)}
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleInviteTeamMember}
              disabled={isInviting}
            >
              {isInviting ? 'Wysyłanie...' : 'Wyślij zaproszenie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}