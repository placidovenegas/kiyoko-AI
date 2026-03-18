export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Generate a unique project slug: readable prefix + short random suffix.
 * Example: "domenech-peluquerias-k8x3mq7"
 */
export function generateProjectSlug(title: string): string {
  const base = slugify(title).slice(0, 40);
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    suffix += chars[byte % chars.length];
  }
  return `${base}-${suffix}`;
}
