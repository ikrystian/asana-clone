import { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ClientForm } from '@/components/clients/client-form';

export const metadata: Metadata = {
  title: 'Dodaj klienta - Asana Clone',
  description: 'Dodaj nowego klienta z danymi kontaktowymi i dostępowymi',
};

export default function NewClientPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dodaj nowego klienta</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Wprowadź dane kontaktowe i dostępowe dla nowego klienta
          </p>
        </div>
        <ClientForm />
      </div>
    </DashboardLayout>
  );
}
