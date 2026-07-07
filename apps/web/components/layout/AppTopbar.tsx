'use client';

// External
import { ChevronRight } from 'lucide-react';

// Shadcn UI
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface AppTopbarProps {
  title: string;
  section?: string;
  actions?: React.ReactNode;
}

export const AppTopbar = ({ title, section, actions }: AppTopbarProps) => (
  <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
    <SidebarTrigger className="-ml-1" />
    <Separator orientation="vertical" className="mr-1 h-4" />
    <div className="flex items-center gap-1.5 text-sm">
      {section && (
        <>
          <span className="text-muted-foreground">{section}</span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </>
      )}
      <span className="font-medium">{title}</span>
    </div>
    {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
  </header>
);
