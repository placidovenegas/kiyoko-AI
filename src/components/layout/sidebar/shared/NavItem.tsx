'use client';

import Link from 'next/link';
import { Tooltip } from '@heroui/react';
import { cn } from '@/lib/utils/cn';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  pathname: string;
  isCollapsed: boolean;
  badge?: number;
  exact?: boolean;
}

export function NavItem({ href, icon: Icon, label, pathname, isCollapsed, badge, exact }: NavItemProps) {
  const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'));
  const btn = (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-md transition-colors cursor-pointer',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isCollapsed ? 'justify-center size-8' : 'w-full gap-2.5 px-2 h-8 text-[13px]',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
      {!isCollapsed && <span className="truncate">{label}</span>}
      {!isCollapsed && badge != null && badge > 0 && (
        <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <li>
      {isCollapsed ? (
        <Tooltip>
          <Tooltip.Trigger>{btn}</Tooltip.Trigger>
          <Tooltip.Content placement="right">{label}</Tooltip.Content>
        </Tooltip>
      ) : btn}
    </li>
  );
}

interface SubNavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  pathname: string;
  statusColor?: string;
}

export function SubNavItem({ href, icon: Icon, label, pathname, statusColor }: SubNavItemProps) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        {statusColor ? (
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusColor)} />
        ) : (
          <Icon className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
        )}
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center px-2 h-7 mb-0.5">
      <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">{children}</span>
    </div>
  );
}

export function SectionLabelWithAction({ children, action }: { children: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 h-7 mb-0.5">
      <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">{children}</span>
      {action}
    </div>
  );
}

export function Divider() {
  return <div className="my-1.5 mx-3 h-px bg-sidebar-border" role="separator" />;
}
