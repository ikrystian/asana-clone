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
    name: z.string().min(1, 'Rule name is required'),
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
      
      toast.success('Automation rule created');
    } catch (error) {
      console.error('Error creating automation rule:', error);
      toast.error('Failed to create automation rule');
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
      
      toast.success(`Rule ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling automation rule:', error);
      toast.error('Failed to update automation rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // In a real app, this would be an API call to delete a rule
      // For now, we'll simulate it
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      toast.success('Automation rule deleted');
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      toast.error('Failed to delete automation rule');
    }
  };

  const handleRunRule = async (ruleId: string) => {
    try {
      // In a real app, this would be an API call to run a rule
      // For now, we'll simulate it
      toast.success('Automation rule executed');
    } catch (error) {
      console.error('Error running automation rule:', error);
      toast.error('Failed to run automation rule');
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'When a task is created';
      case 'TASK_UPDATED':
        return 'When a task is updated';
      case 'TASK_COMPLETED':
        return 'When a task is completed';
      case 'DUE_DATE_APPROACHING':
        return 'When a due date is approaching';
      default:
        return type;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'UPDATE_TASK':
        return 'Update task';
      case 'CREATE_TASK':
        return 'Create a new task';
      case 'SEND_NOTIFICATION':
        return 'Send notification';
      case 'ASSIGN_TASK':
        return 'Assign task';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Automation Rules</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Automate repetitive tasks with rules that trigger actions based on events.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddRule)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-assign tasks" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trigger" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TASK_CREATED">When a task is created</SelectItem>
                          <SelectItem value="TASK_UPDATED">When a task is updated</SelectItem>
                          <SelectItem value="TASK_COMPLETED">When a task is completed</SelectItem>
                          <SelectItem value="DUE_DATE_APPROACHING">When a due date is approaching</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This event will trigger the automation rule.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="actionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UPDATE_TASK">Update task</SelectItem>
                          <SelectItem value="CREATE_TASK">Create a new task</SelectItem>
                          <SelectItem value="SEND_NOTIFICATION">Send notification</SelectItem>
                          <SelectItem value="ASSIGN_TASK">Assign task</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This action will be performed when the trigger conditions are met.
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
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this automation rule
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
                Cancel
              </Button>
              <Button 
                onClick={form.handleSubmit(handleAddRule)}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No automation rules yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Create automation rules to streamline your workflow and reduce manual tasks
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Rule
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
                            Inactive
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
                          <div className="text-sm font-medium">Trigger</div>
                          <div className="text-sm bg-muted/50 p-2 rounded-md">
                            {getTriggerLabel(rule.trigger.type)}
                          </div>
                          {rule.trigger.conditions.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium">Conditions</div>
                              {rule.trigger.conditions.map((condition, index) => (
                                <div key={index} className="text-xs bg-muted/30 p-1 rounded-md">
                                  {condition.field} {condition.operator} {condition.value}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Actions</div>
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
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRunRule(rule.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run Now
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingRuleId(rule.id)}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
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
            <DialogTitle>Edit Automation Rule</DialogTitle>
            <DialogDescription>
              Modify this automation rule's settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Rule editing functionality would be implemented in a full version.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRuleId(null)}>
              Cancel
            </Button>
            <Button onClick={() => setEditingRuleId(null)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
