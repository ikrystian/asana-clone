'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause,
  Settings,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface AutomationRule {
  id: string;
  name: string;
  projectId: string;
  trigger: {
    type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'DUE_DATE_APPROACHING';
    conditions: {
      field: string;
      operator: string;
      value: string;
    }[];
  };
  actions: {
    type: 'UPDATE_TASK' | 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'ASSIGN_TASK';
    parameters: Record<string, string>;
  }[];
  isActive: boolean;
  createdAt: string;
}

interface AutomationRulesProps {
  projectId: string;
  initialRules: AutomationRule[];
}

export function AutomationRules({ projectId, initialRules }: AutomationRulesProps) {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const ruleSchema = z.object({
    name: z.string().min(1, 'Nazwa reguły jest wymagana'),
    triggerType: z.enum(['TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED', 'DUE_DATE_APPROACHING']),
    actionType: z.enum(['UPDATE_TASK', 'CREATE_TASK', 'SEND_NOTIFICATION', 'ASSIGN_TASK']),
    isActive: z.boolean().default(true),
  });

  type RuleFormValues = z.infer<typeof ruleSchema>;

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      triggerType: 'TASK_CREATED',
      actionType: 'UPDATE_TASK',
      isActive: true,
    },
  });

  const handleAddRule = async (data: RuleFormValues) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call to create a rule
      // For now, we'll simulate it
      const newRule: AutomationRule = {
        id: `rule-${Date.now()}`,
        name: data.name,
        projectId,
        trigger: {
          type: data.triggerType,
          conditions: [],
        },
        actions: [
          {
            type: data.actionType,
            parameters: {},
          },
        ],
        isActive: data.isActive,
        createdAt: new Date().toISOString(),
      };
      
      setRules(prev => [...prev, newRule]);
      setIsAddDialogOpen(false);
      form.reset();
      
      toast.success('Reguła automatyzacji została utworzona');
    } catch (error) {
      console.error('Błąd podczas tworzenia reguły automatyzacji:', error);
      toast.error('Nie udało się utworzyć reguły automatyzacji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      // In a real app, this would be an API call to update a rule
      // For now, we'll simulate it
      setRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, isActive } : rule
        )
      );
      
      toast.success(`Reguła ${isActive ? 'aktywna' : 'nieaktywna'}`);
    } catch (error) {
      console.error('Błąd podczas przełączania reguły automatyzacji:', error);
      toast.error('Nie udało się zaktualizować reguły automatyzacji');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // In a real app, this would be an API call to delete a rule
      // For now, we'll simulate it
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      toast.success('Reguła automatyzacji została usunięta');
    } catch (error) {
      console.error('Błąd podczas usuwania reguły automatyzacji:', error);
      toast.error('Nie udało się usunąć reguły automatyzacji');
    }
  };

  const handleRunRule = async (ruleId: string) => {
    try {
      // In a real app, this would be an API call to run a rule
      // For now, we'll simulate it
      toast.success('Reguła automatyzacji została wykonana');
    } catch (error) {
      console.error('Błąd podczas uruchamiania reguły automatyzacji:', error);
      toast.error('Nie udało się uruchomić reguły automatyzacji');
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'Gdy zadanie zostanie utworzone';
      case 'TASK_UPDATED':
        return 'Gdy zadanie zostanie zaktualizowane';
      case 'TASK_COMPLETED':
        return 'Gdy zadanie zostanie ukończone';
      case 'DUE_DATE_APPROACHING':
        return 'Gdy zbliża się termin wykonania';
      default:
        return type;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'UPDATE_TASK':
        return 'Zaktualizuj zadanie';
      case 'CREATE_TASK':
        return 'Utwórz nowe zadanie';
      case 'SEND_NOTIFICATION':
        return 'Wyślij powiadomienie';
      case 'ASSIGN_TASK':
        return 'Przypisz zadanie';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Reguły automatyzacji</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj regułę
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Utwórz regułę automatyzacji</DialogTitle>
              <DialogDescription>
                Automatyzuj powtarzalne zadania za pomocą reguł, które wyzwalają akcje na podstawie zdarzeń.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddRule)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa reguły</FormLabel>
                      <FormControl>
                        <Input placeholder="Automatyczne przypisywanie zadań" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wyzwalacz</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz wyzwalacz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TASK_CREATED">Gdy zadanie zostanie utworzone</SelectItem>
                          <SelectItem value="TASK_UPDATED">Gdy zadanie zostanie zaktualizowane</SelectItem>
                          <SelectItem value="TASK_COMPLETED">Gdy zadanie zostanie ukończone</SelectItem>
                          <SelectItem value="DUE_DATE_APPROACHING">Gdy zbliża się termin wykonania</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        To zdarzenie wyzwoli regułę automatyzacji.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="actionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Akcja</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz akcję" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UPDATE_TASK">Zaktualizuj zadanie</SelectItem>
                          <SelectItem value="CREATE_TASK">Utwórz nowe zadanie</SelectItem>
                          <SelectItem value="SEND_NOTIFICATION">Wyślij powiadomienie</SelectItem>
                          <SelectItem value="ASSIGN_TASK">Przypisz zadanie</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Ta akcja zostanie wykonana, gdy warunki wyzwalacza zostaną spełnione.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Aktywna</FormLabel>
                        <FormDescription>
                          Włącz lub wyłącz tę regułę automatyzacji
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Anuluj
              </Button>
              <Button 
                onClick={form.handleSubmit(handleAddRule)}
                disabled={isLoading}
              >
                {isLoading ? 'Tworzenie...' : 'Utwórz regułę'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Brak reguł automatyzacji</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Utwórz reguły automatyzacji, aby usprawnić przepływ pracy i zredukować zadania manualne
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Utwórz swoją pierwszą regułę
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={rule.isActive ? '' : 'opacity-70'}>
              <AccordionItem value={rule.id} className="border-none">
                <CardHeader className="p-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{rule.name}</div>
                        {!rule.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Nieaktywna
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Wyzwalacz</div>
                          <div className="text-sm bg-muted/50 p-2 rounded-md">
                            {getTriggerLabel(rule.trigger.type)}
                          </div>
                          {rule.trigger.conditions.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium">Warunki</div>
                              {rule.trigger.conditions.map((condition, index) => (
                                <div key={index} className="text-xs bg-muted/30 p-1 rounded-md">
                                  {condition.field} {condition.operator} {condition.value}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Akcje</div>
                          {rule.actions.map((action, index) => (
                            <div key={index} className="text-sm bg-muted/50 p-2 rounded-md">
                              {getActionLabel(action.type)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          />
                          <span className="text-sm">
                            {rule.isActive ? 'Aktywna' : 'Nieaktywna'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRunRule(rule.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Uruchom teraz
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingRuleId(rule.id)}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edytuj
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Usuń
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}

      {/* Edit Rule Dialog - would be implemented in a real app */}
      <Dialog open={!!editingRuleId} onOpenChange={(open) => !open && setEditingRuleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj regułę automatyzacji</DialogTitle>
            <DialogDescription>
              Zmodyfikuj ustawienia tej reguły automatyzacji.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Funkcjonalność edycji reguł zostanie zaimplementowana w pełnej wersji.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRuleId(null)}>
              Anuluj
            </Button>
            <Button onClick={() => setEditingRuleId(null)}>
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}