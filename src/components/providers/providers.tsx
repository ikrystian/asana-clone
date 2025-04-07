'use client';

import { ReactNode } from 'react';
import { SessionProvider } from './session-provider';
import { ToastProvider } from './toast-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider />
      {children}
    </SessionProvider>
  );
}
