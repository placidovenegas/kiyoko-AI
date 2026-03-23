import { redirect } from 'next/navigation';

interface StoryboardRedirectProps {
  params: Promise<{ shortId: string; videoShortId: string }>;
}

export default async function StoryboardRedirect({ params }: StoryboardRedirectProps) {
  const { shortId, videoShortId } = await params;
  redirect(`/project/${shortId}/video/${videoShortId}`);
}
