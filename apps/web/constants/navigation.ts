import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isPlaceholder?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const DEMO_USER = {
  name: 'Trishane',
  email: 'trishane@catconstruction.com',
  role: 'Safety Lead',
  initials: 'T',
};

// Only Dashboard and Incidents route to real pages. Everything else is a
// placeholder for the demo and surfaces a "coming soon" toast on click.
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Ask Praesid', href: '#', icon: Sparkles, badge: 'NEW', isPlaceholder: true },
      { label: 'Review queue', href: '#', icon: ListChecks, isPlaceholder: true },
      { label: 'Notifications', href: '#', icon: Bell, isPlaceholder: true },
    ],
  },
  {
    label: 'Safety',
    items: [
      { label: 'Dashboard', href: '#', icon: LayoutDashboard, isPlaceholder: true },
      { label: 'Incidents', href: '/dashboard', icon: ShieldAlert },
      { label: 'OIICS Codes', href: '#', icon: ScrollText, isPlaceholder: true },
      { label: 'Imports', href: '#', icon: FileSpreadsheet, isPlaceholder: true },
      { label: 'Reports', href: '#', icon: BarChart3, isPlaceholder: true },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { label: 'Assets', href: '#', icon: Boxes, isPlaceholder: true },
      { label: 'Maintenance signals', href: '#', icon: Activity, isPlaceholder: true },
      { label: 'Work orders', href: '#', icon: Wrench, isPlaceholder: true },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Members', href: '#', icon: Users, isPlaceholder: true },
      { label: 'Roles & access', href: '#', icon: KeyRound, isPlaceholder: true },
      { label: 'Audit log', href: '#', icon: ClipboardList, isPlaceholder: true },
    ],
  },
];
