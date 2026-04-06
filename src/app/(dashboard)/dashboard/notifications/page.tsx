import type { Metadata } from 'next';
import { InboxView } from '@/components/dashboard/InboxView';

export const metadata: Metadata = {
  title: 'Inbox | Kiyoko AI',
};

export default function DashboardInboxPage() {
  return <InboxView />;
}