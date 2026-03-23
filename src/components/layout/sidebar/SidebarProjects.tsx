'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { SidebarProjectItem } from './SidebarProjectItem';

export function SidebarProjects() {
  const supabase = createClient();

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, short_id, title, client_name, status')
        .order('updated_at', { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Proyectos</SidebarGroupLabel>

      <SidebarGroupAction render={<Link href="/new" title="Nuevo proyecto" />}>
        <Plus className="h-4 w-4" />
      </SidebarGroupAction>

      <SidebarGroupContent>
        <SidebarMenu>
          {projects?.map((project) => (
            <SidebarProjectItem key={project.id} project={project} />
          ))}

          {(!projects || projects.length === 0) && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Sin proyectos
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
