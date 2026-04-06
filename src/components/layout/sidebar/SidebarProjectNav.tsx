'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Film, Users, Mountain, Paintbrush, FileText,
  Smartphone, CheckSquare, Settings, Bot, UserPlus, Plus, Palette,
} from 'lucide-react';
import { Popover, Tooltip } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideosByProject } from '@/lib/queries/videos';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils/cn';
import { NavItem, SubNavItem, SectionLabel, SectionLabelWithAction, Divider } from './shared/NavItem';
import { useUIStore } from '@/stores/useUIStore';
import { useTranslations } from 'next-intl';

const VIDEO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400', prompting: 'bg-blue-400', generating: 'bg-amber-400',
  review: 'bg-purple-400', approved: 'bg-emerald-400', exported: 'bg-emerald-600',
};

export function SidebarProjectNav({ projectShortId }: { projectShortId: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const base = `/project/${projectShortId}`;
  const t = useTranslations();
  const projectSettingsModalOpen = useUIStore((store) => store.projectSettingsModalOpen);
  const projectSettingsSection = useUIStore((store) => store.projectSettingsSection);
  const openProjectSettingsModal = useUIStore((store) => store.openProjectSettingsModal);

  const { data: project } = useQuery({
    queryKey: ['project-nav', projectShortId],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, title').eq('short_id', projectShortId).single();
      return data;
    },
  });

  const { data: videos } = useQuery({
    queryKey: queryKeys.videos.byProject(project?.id ?? ''),
    queryFn: () => (project ? fetchVideosByProject(supabase, project.id) : Promise.resolve([])),
    enabled: !!project?.id,
  });

  function renderSettingsButton({
    label,
    icon: Icon,
    section,
  }: {
    label: string;
    icon: typeof Settings;
    section: string;
  }) {
    const isActive = (projectSettingsModalOpen && projectSettingsSection === section)
      || pathname === `${base}/settings${section === 'ia' ? '/ai' : ''}`;

    const button = (
      <button
        type="button"
        onClick={() => openProjectSettingsModal(section)}
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
      </button>
    );

    return (
      <li>
        {isCollapsed ? (
          <Tooltip>
            <Tooltip.Trigger>{button}</Tooltip.Trigger>
            <Tooltip.Content placement="right">{label}</Tooltip.Content>
          </Tooltip>
        ) : button}
      </li>
    );
  }

  // ── Collapsed ──
  if (isCollapsed) {
    return (
      <div className="flex flex-col">
        <div className="px-2 py-1">
          <ul className="flex flex-col gap-0.5">
            <NavItem href={base} icon={LayoutDashboard} label={t('project.title')} pathname={pathname} isCollapsed exact />
            <NavItem href={`${base}/tasks`} icon={CheckSquare} label={t('project.tasks')} pathname={pathname} isCollapsed />
            <NavItem href={`${base}/publications`} icon={Smartphone} label={t('nav.publications')} pathname={pathname} isCollapsed />
          </ul>
        </div>
        <Divider />
        <div className="px-2 py-1">
          <Popover>
            <Tooltip><Tooltip.Trigger>
              <Popover.Trigger><button type="button" className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"><Film className="h-4 w-4" /></button></Popover.Trigger>
            </Tooltip.Trigger><Tooltip.Content placement="right">Videos</Tooltip.Content></Tooltip>
            <Popover.Content className="w-56 p-1">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[11px] font-medium text-muted-foreground">Videos</p>
                <Link href={`${base}/videos`} className="flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"><Plus className="h-3.5 w-3.5" /></Link>
              </div>
              {videos?.map((v) => (
                <Link key={v.id} href={`${base}/video/${v.short_id}`} className={cn('flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors', pathname.startsWith(`${base}/video/${v.short_id}`) ? 'bg-accent font-medium text-foreground' : 'text-foreground/80 hover:bg-accent')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', VIDEO_STATUS_COLORS[v.status] ?? 'bg-zinc-400')} />
                  <span className="truncate">{v.title}</span>
                </Link>
              ))}
              {videos && videos.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">Sin vídeos</p>}
            </Popover.Content>
          </Popover>
        </div>
        <div className="px-2 py-1">
          <Popover>
            <Tooltip><Tooltip.Trigger>
              <Popover.Trigger><button type="button" className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"><Palette className="h-4 w-4" /></button></Popover.Trigger>
            </Tooltip.Trigger><Tooltip.Content placement="right">Recursos</Tooltip.Content></Tooltip>
            <Popover.Content className="w-56 p-1">
              <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">Recursos</p>
              {[
                { href: `${base}/resources/characters`, icon: Users, label: t('project.characters') },
                { href: `${base}/resources/backgrounds`, icon: Mountain, label: t('project.backgrounds') },
                { href: `${base}/resources/styles`, icon: Paintbrush, label: t('settings.defaultStyle') },
                { href: `${base}/resources/templates`, icon: FileText, label: 'Templates' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className={cn('flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors', (pathname === item.href || pathname.startsWith(item.href + '/')) ? 'bg-accent font-medium text-foreground' : 'text-foreground/80 hover:bg-accent')}>
                  <item.icon className="h-3 w-3 shrink-0 text-muted-foreground/60" /><span className="truncate">{item.label}</span>
                </Link>
              ))}
            </Popover.Content>
          </Popover>
        </div>
        <Divider />
        <div className="px-2 py-1">
          <ul className="flex flex-col gap-0.5">
            {renderSettingsButton({ label: t('settings.title'), icon: Settings, section: 'general' })}
            {renderSettingsButton({ label: t('ai.director'), icon: Bot, section: 'ia' })}
            <NavItem href={`${base}/settings/sharing`} icon={UserPlus} label="Compartir" pathname={pathname} isCollapsed />
          </ul>
        </div>
      </div>
    );
  }

  // ── Expanded ──
  return (
    <div className="flex flex-col">
      {/* General */}
      <div className="px-1.5 py-1">
        <SectionLabel>General</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          <NavItem href={base} icon={LayoutDashboard} label={t('project.title')} pathname={pathname} isCollapsed={false} exact />
          <NavItem href={`${base}/tasks`} icon={CheckSquare} label={t('project.tasks')} pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/publications`} icon={Smartphone} label={t('nav.publications')} pathname={pathname} isCollapsed={false} />
        </ul>
      </div>

      <Divider />

      {/* Videos */}
      <div className="px-1.5 py-1">
        <SectionLabelWithAction action={<Link href={`${base}/videos`} className="flex items-center justify-center size-5 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer" title={t('video.newVideo')}><Plus className="h-3.5 w-3.5" /></Link>}>{t('project.videos')}</SectionLabelWithAction>
        <ul className="flex flex-col gap-0.5">
          {videos?.map((v) => (
            <SubNavItem key={v.id} href={`${base}/video/${v.short_id}`} icon={Film} label={v.title} pathname={pathname} statusColor={VIDEO_STATUS_COLORS[v.status]} />
          ))}
          {videos && videos.length === 0 && <li className="px-2 py-1 text-xs text-sidebar-foreground/40">{t('video.noVideos')}</li>}
        </ul>
      </div>

      <Divider />

      {/* Recursos */}
      <div className="px-1.5 py-1">
        <SectionLabel>{t('project.resources')}</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          <NavItem href={`${base}/resources/characters`} icon={Users} label={t('project.characters')} pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/resources/backgrounds`} icon={Mountain} label={t('project.backgrounds')} pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/resources/styles`} icon={Paintbrush} label={t('settings.defaultStyle')} pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/resources/templates`} icon={FileText} label="Templates" pathname={pathname} isCollapsed={false} />
        </ul>
      </div>

      <Divider />

      {/* Ajustes */}
      <div className="px-1.5 py-1">
        <SectionLabel>{t('settings.title')}</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {renderSettingsButton({ label: 'General', icon: Settings, section: 'general' })}
          {renderSettingsButton({ label: t('ai.director'), icon: Bot, section: 'ia' })}
          <NavItem href={`${base}/settings/sharing`} icon={UserPlus} label="Compartir" pathname={pathname} isCollapsed={false} />
        </ul>
      </div>
    </div>
  );
}
