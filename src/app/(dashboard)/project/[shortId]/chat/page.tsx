'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAIStore } from '@/stores/ai-store';

export default function ProjectChatPage() {
  const router = useRouter();
  const params = useParams<{ shortId: string }>();
  const openChat = useAIStore((state) => state.openChat);
  const setActiveAgent = useAIStore((state) => state.setActiveAgent);

  useEffect(() => {
    setActiveAgent('project');
    openChat('sidebar');
    router.replace(`/project/${params.shortId}`, { scroll: false });
  }, [openChat, params.shortId, router, setActiveAgent]);

  return null;
}
