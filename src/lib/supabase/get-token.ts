'use client';

/**
 * Reads the Supabase access token directly from cookies.
 * Bypasses supabase.auth.getSession() which deadlocks due to navigator.locks.
 *
 * Supabase SSR stores the session in chunked cookies:
 *   sb-<project-ref>-auth-token.0 = base64-<chunk0>
 *   sb-<project-ref>-auth-token.1 = <chunk1>
 *   ...
 *
 * The concatenated value (after removing "base64-" prefix) is base64-encoded JSON
 * containing { access_token, refresh_token, ... }
 */

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .replace('https://', '')
  .replace('.supabase.co', '');

export function getAccessTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;

  const prefix = `sb-${PROJECT_REF}-auth-token`;
  const cookies = document.cookie.split(';').reduce<Record<string, string>>((acc, c) => {
    const [key, ...rest] = c.trim().split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});

  // Collect chunks in order: .0, .1, .2, ...
  let raw = '';
  let i = 0;
  while (true) {
    const chunk = cookies[`${prefix}.${i}`];
    if (chunk === undefined) break;
    raw += chunk;
    i++;
  }

  // Also check for non-chunked cookie
  if (!raw && cookies[prefix]) {
    raw = cookies[prefix];
  }

  if (!raw) return null;

  // Remove "base64-" prefix if present
  const cleaned = raw.startsWith('base64-') ? raw.slice(7) : raw;

  try {
    const json = atob(cleaned);
    const parsed = JSON.parse(json);
    return parsed?.access_token ?? null;
  } catch {
    // Try URL-decoded
    try {
      const decoded = decodeURIComponent(cleaned);
      const parsed = JSON.parse(decoded);
      return parsed?.access_token ?? null;
    } catch {
      return null;
    }
  }
}
