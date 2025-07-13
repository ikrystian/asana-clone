import { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ClientsList } from '@/components/clients/clients-list';

export const metadata: Metadata = {
  title: 'Klienci - Asana Clone',
  description: 'Zarządzaj danymi klientów, danymi dostępowymi i informacjami kontaktowymi',
};

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Klienci</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Zarządzaj danymi klientów, danymi dostępowymi i informacjami kontaktowymi
          </p>
        </div>
        <ClientsList />
      </div>
    </DashboardLayout>
  );
}
