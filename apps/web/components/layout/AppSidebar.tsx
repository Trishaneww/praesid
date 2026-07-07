'use client';

// Next.js
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// External
import { toast } from 'sonner';
import { ChevronsUpDown, HardHat, LogOut, Settings, Sparkles } from 'lucide-react';

// Shadcn UI
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Hooks
import { useWorkspace } from '@/hooks/useWorkspace';

// Constants + logic
import { DEMO_USER, NAV_GROUPS } from '@/constants/navigation';
import { isNavItemActive } from '@/lib/navigation';

const notifyComingSoon = (label: string) =>
  toast(`${label} is coming soon.`, {
    description: 'This section is part of the Praesid roadmap.',
  });

export const AppSidebar = () => {
  const pathname = usePathname();
  const { tenant, tenants } = useWorkspace();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" tooltip="Switch workspace" />}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HardHat className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">
                    {tenant?.name ?? 'Praesid'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Safety workspace
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--anchor-width) min-w-56"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  {tenants.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() =>
                        option.id === tenant?.id
                          ? undefined
                          : notifyComingSoon('Switching workspaces')
                      }
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border text-xs font-medium">
                        {option.name.charAt(0)}
                      </div>
                      <span className="truncate">{option.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isNavItemActive(item, pathname);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={
                        item.isPlaceholder ? undefined : (
                          <Link href={item.href} />
                        )
                      }
                      onClick={
                        item.isPlaceholder
                          ? () => notifyComingSoon(item.label)
                          : undefined
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-primary/10 text-primary">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" tooltip={DEMO_USER.name} />}
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    {DEMO_USER.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">{DEMO_USER.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {DEMO_USER.role}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--anchor-width) min-w-56"
                align="start"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="grid leading-tight">
                      <span className="truncate font-medium">
                        {DEMO_USER.name}
                      </span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        {DEMO_USER.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => notifyComingSoon('Assistant')}>
                  <Sparkles />
                  Ask Praesid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => notifyComingSoon('Settings')}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => notifyComingSoon('Sign out')}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
