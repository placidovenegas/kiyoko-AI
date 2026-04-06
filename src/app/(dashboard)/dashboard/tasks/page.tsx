import type { Metadata } from 'next';
import { DashboardTasksView } from '@/components/dashboard/DashboardTasksView';

export const metadata: Metadata = {
  title: 'Tasks | Kiyoko AI',
};

export default function DashboardTasksPage() {
  return <DashboardTasksView />;
}