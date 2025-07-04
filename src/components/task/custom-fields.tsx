'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon, Plus, X, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface CustomField {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'CHECKBOX';
  options?: string; // JSON string for dropdown options
  required: boolean;
}

interface CustomFieldValue {
  id: string;
  value: string;
  fieldId: string;
  field: CustomField;
}

interface CustomFieldsProps {
  taskId: string;
  projectId: string;
  customFields: CustomField[];
  customFieldValues: CustomFieldValue[];
  onAddField?: () => void;
}

export function CustomFields({ 
  taskId, 
  projectId, 
  customFields, 
  customFieldValues, 
  onAddField 
}: CustomFieldsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customFieldSchema = z.object({
    value: z.string(),
  });

  type CustomFieldFormValues = z.infer<typeof customFieldSchema>;

  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      value: '',
    },
  });

  const handleEditField = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    form.setValue('value', currentValue);
  };

  const handleSaveField = async (fieldId: string) => {
    const value = form.getValues('value');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/custom-fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować pola niestandardowego');
      }

      toast.success('Pole niestandardowe zostało zaktualizowane');
      setEditingField(null);
    } catch (error) {
      console.error('Błąd podczas aktualizacji pola niestandardowego:', error);
      toast.error('Nie udało się zaktualizować pola niestandardowego');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldValueComponent = (field: CustomField, value: string) => {
    if (editingField === field.id) {
      return (
        <Form {...form}>
          <form 
            className="flex items-center space-x-2" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveField(field.id);
            }}
          >
            <FormField
              control={form.control}
              name="value"
              render={({ field: formField }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    {field.type === 'TEXT' && (
                      <Input {...formField} placeholder="Wprowadź tekst..." />
                    )}
                    {field.type === 'NUMBER' && (
                      <Input 
                        {...formField} 
                        type="number" 
                        placeholder="Wprowadź liczbę..." 
                      />
                    )}
                    {field.type === 'DATE' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formField.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formField.value ? format(new Date(formField.value), 'PPP', { locale: pl }) : <span>Wybierz datę</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formField.value ? new Date(formField.value) : undefined}
                            onSelect={(date) => formField.onChange(date?.toISOString() || '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    {field.type === 'DROPDOWN' && (
                      <Select 
                        onValueChange={formField.onChange} 
                        defaultValue={formField.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz opcję" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options && JSON.parse(field.options).map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'CHECKBOX' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`checkbox-${field.id}`}
                          checked={formField.value === 'true'}
                          onCheckedChange={(checked) => {
                            formField.onChange(checked ? 'true' : 'false');
                          }}
                        />
                        <label 
                          htmlFor={`checkbox-${field.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {field.name}
                        </label>
                      </div>
                    )}
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" variant="ghost" disabled={isSubmitting}>
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              onClick={() => setEditingField(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      );
    }

    switch (field.type) {
      case 'TEXT':
      case 'NUMBER':
        return (
          <div className="text-sm">{value || '-'}</div>
        );
      case 'DATE':
        return (
          <div className="text-sm">
            {value ? format(new Date(value), 'PPP', { locale: pl }) : '-'}
          </div>
        );
      case 'DROPDOWN':
        return (
          <div className="text-sm">{value || '-'}</div>
        );
      case 'CHECKBOX':
        return (
          <Checkbox 
            checked={value === 'true'} 
            disabled 
          />
        );
      default:
        return <div className="text-sm">{value || '-'}</div>;
    }
  };

  // Find existing values for each field
  const getFieldValue = (fieldId: string) => {
    const fieldValue = customFieldValues.find(v => v.fieldId === fieldId);
    return fieldValue ? fieldValue.value : '';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Pola niestandardowe</h3>
        {onAddField && (
          <Button variant="ghost" size="sm" onClick={onAddField}>
            <Plus className="h-4 w-4 mr-1" />
            Dodaj pole
          </Button>
        )}
      </div>

      {customFields.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          Brak dostępnych pól niestandardowych
        </div>
      ) : (
        <div className="space-y-2">
          {customFields.map((field) => (
            <div 
              key={field.id} 
              className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"
            >
              <div className="font-medium text-sm">{field.name}</div>
              <div className="flex items-center space-x-2">
                <div className="min-w-32 text-right">
                  {getFieldValueComponent(field, getFieldValue(field.id))}
                </div>
                {editingField !== field.id && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => handleEditField(field.id, getFieldValue(field.id))}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}