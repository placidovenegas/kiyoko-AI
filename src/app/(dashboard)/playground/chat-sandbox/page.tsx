import type { Metadata } from 'next';
import { ChatSandboxView } from '@/components/chat/ChatSandboxView';

export const metadata: Metadata = {
  title: 'Chat Sandbox | Kiyoko AI',
};

export default async function ChatSandboxPage() {
  return (
    <div className="h-svh max-h-svh overflow-hidden">
      <ChatSandboxView />
    </div>
  );
}

