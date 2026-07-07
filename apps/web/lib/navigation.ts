import { NavItem } from '@/constants/navigation';

export const isNavItemActive = (item: NavItem, pathname: string): boolean => {
  if (item.isPlaceholder || item.href === '#') return false;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};
