'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronsUpDown, Settings, Key, LogOut, PanelLeft, Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@heroui/react';

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? '?';
}

export function SidebarUserFooter() {
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile({
              full_name: data.full_name,
              email: data.email ?? user.email ?? '',
              avatar_url: data.avatar_url,
            });
          }
        });
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!profile) return null;

  const initials = getInitials(profile.full_name, profile.email);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar
                className="h-8 w-8 rounded-lg"
                src={profile.avatar_url ?? undefined}
                alt={profile.full_name ?? ''}
                name={profile.full_name ?? initials}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile.full_name ?? 'Usuario'}</span>
                <span className="truncate text-xs text-sidebar-foreground/50">{profile.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side="top"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="h-8 w-8 rounded-lg"
                  src={profile.avatar_url ?? undefined}
                  alt={profile.full_name ?? ''}
                  name={profile.full_name ?? initials}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile.full_name ?? 'Usuario'}</span>
                  <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 size-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/api-keys')}>
              <Key className="mr-2 size-4" /> API Keys
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <PanelLeft className="mr-2 size-4" /> Menu
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setOpen(true)} className="justify-between">
                    Expandido
                    {open && <Check className="size-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setOpen(false)} className="justify-between">
                    Colapsado
                    {!open && <Check className="size-4" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" /> Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
