// Shadcn UI
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

// Layout
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
