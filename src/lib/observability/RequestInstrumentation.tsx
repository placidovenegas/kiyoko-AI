'use client';

import { useEffect } from 'react';
import { logClientError } from '@/lib/observability/logger';

const REQUEST_HEADER = 'x-kiyoko-client-request-id';

declare global {
  interface Window {
    __kiyokoFetchPatched?: boolean;
    __kiyokoOriginalFetch?: typeof window.fetch;
  }
}

function buildUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isSameOriginRequest(url: string) {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

function mergeHeaders(input: RequestInfo | URL, init: RequestInit | undefined, requestId: string) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  const initHeaders = new Headers(init?.headers);

  initHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  if (!headers.has(REQUEST_HEADER)) {
    headers.set(REQUEST_HEADER, requestId);
  }

  return headers;
}

export function RequestInstrumentation() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__kiyokoFetchPatched) {
      return;
    }

    window.__kiyokoFetchPatched = true;
    window.__kiyokoOriginalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
      const url = buildUrl(input);
      const startedAt = performance.now();
      const requestId = crypto.randomUUID();

      try {
        let patchedInput = input;
        let patchedInit = init;

        if (isSameOriginRequest(url)) {
          const headers = mergeHeaders(input, init, requestId);

          if (input instanceof Request) {
            patchedInput = new Request(input, {
              ...init,
              headers,
            });
            patchedInit = undefined;
          } else {
            patchedInit = {
              ...init,
              headers,
            };
          }
        }

        const response = await window.__kiyokoOriginalFetch!(patchedInput, patchedInit);
        const durationMs = Math.round(performance.now() - startedAt);

        if (!response.ok) {
          logClientError('fetch', new Error(`HTTP ${response.status} ${response.statusText}`), {
            method,
            url,
            status: response.status,
            durationMs,
            requestId,
            serverRequestId: response.headers.get('x-request-id'),
          });
        }

        return response;
      } catch (error) {
        const durationMs = Math.round(performance.now() - startedAt);
        logClientError('fetch', error, {
          method,
          url,
          durationMs,
          requestId,
        });
        throw error;
      }
    };

    return () => {
      if (window.__kiyokoOriginalFetch) {
        window.fetch = window.__kiyokoOriginalFetch;
      }
      window.__kiyokoFetchPatched = false;
    };
  }, []);

  return null;
}
