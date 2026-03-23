import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kiyoko AI',
    short_name: 'Kiyoko',
    description: 'Producción de vídeo con IA para redes sociales',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#0EA5A0',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
