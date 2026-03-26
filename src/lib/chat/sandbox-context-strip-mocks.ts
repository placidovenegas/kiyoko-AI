import type { ContextLevel } from '@/types/ai-context';
import type { DashboardContextStatsLite } from '@/lib/chat/fetch-dashboard-context-stats';
import type { ProjectContextStatsLite } from '@/lib/chat/fetch-project-context-stats';
import type { SandboxChatContext } from '@/components/chat/ChatSandboxEmptyState';

/** Cadenas alineadas con `ChatSandboxEmptyState` (demo). */
export const SANDBOX_CONTEXT_DEMO = {
  projectTitle: 'Proyecto Alpha',
  videoTitle: 'Summer Sale',
  sceneLabel: '#1 · Hook',
} as const;

/** Conteos ficticios para previsualizar el mismo resumen que en producción. */
export const SANDBOX_CONTEXT_STATS_MOCK: ProjectContextStatsLite = {
  videoCount: 2,
  characterCount: 4,
  backgroundCount: 2,
  sceneCount: 8,
  openTaskCount: 3,
  totalTaskCount: 12,
  projectsInScopeCount: 5,
  scenesInCurrentVideo: 4,
};

/** Agregado ficticio para modo dashboard en sandbox. */
export const SANDBOX_DASHBOARD_STATS_MOCK: DashboardContextStatsLite = {
  projectCount: 5,
  openTaskCount: 3,
  totalTaskCount: 12,
  videoCount: 2,
  characterCount: 4,
  backgroundCount: 2,
  sceneCount: 8,
};

export function getSandboxContextStripProps(ctx: SandboxChatContext): {
  contextLevel: ContextLevel;
  projectTitle: string | null;
  videoTitle: string | null;
  sceneLabel: string | null;
  stats: ProjectContextStatsLite | null;
  statsLoading: boolean;
  dashboardStats: DashboardContextStatsLite | null;
  dashboardStatsLoading: boolean;
  projectLoading: boolean;
} {
  switch (ctx) {
    case 'dashboard':
      return {
        contextLevel: 'dashboard',
        projectTitle: null,
        videoTitle: null,
        sceneLabel: null,
        stats: null,
        statsLoading: false,
        dashboardStats: SANDBOX_DASHBOARD_STATS_MOCK,
        dashboardStatsLoading: false,
        projectLoading: false,
      };
    case 'proyecto':
    case 'recursos_proyecto':
      return {
        contextLevel: 'project',
        projectTitle: SANDBOX_CONTEXT_DEMO.projectTitle,
        videoTitle: null,
        sceneLabel: null,
        stats: SANDBOX_CONTEXT_STATS_MOCK,
        statsLoading: false,
        dashboardStats: null,
        dashboardStatsLoading: false,
        projectLoading: false,
      };
    case 'video':
      return {
        contextLevel: 'video',
        projectTitle: SANDBOX_CONTEXT_DEMO.projectTitle,
        videoTitle: SANDBOX_CONTEXT_DEMO.videoTitle,
        sceneLabel: null,
        stats: SANDBOX_CONTEXT_STATS_MOCK,
        statsLoading: false,
        dashboardStats: null,
        dashboardStatsLoading: false,
        projectLoading: false,
      };
    case 'escena':
      return {
        contextLevel: 'scene',
        projectTitle: SANDBOX_CONTEXT_DEMO.projectTitle,
        videoTitle: SANDBOX_CONTEXT_DEMO.videoTitle,
        sceneLabel: SANDBOX_CONTEXT_DEMO.sceneLabel,
        stats: SANDBOX_CONTEXT_STATS_MOCK,
        statsLoading: false,
        dashboardStats: null,
        dashboardStatsLoading: false,
        projectLoading: false,
      };
    default:
      return {
        contextLevel: 'dashboard',
        projectTitle: null,
        videoTitle: null,
        sceneLabel: null,
        stats: null,
        statsLoading: false,
        dashboardStats: SANDBOX_DASHBOARD_STATS_MOCK,
        dashboardStatsLoading: false,
        projectLoading: false,
      };
  }
}
