import { NextResponse } from 'next/server';
import { normalizeError } from '@/lib/observability/logger';

type ServerLogContext = Record<string, unknown>;

export interface ApiRequestContext {
  requestId: string;
  clientRequestId: string | null;
  method: string;
  path: string;
  startedAt: number;
}

interface ApiResponseOptions {
  status?: number;
  headers?: HeadersInit;
}

function withTimestamp(context?: ServerLogContext) {
  return {
    timestamp: new Date().toISOString(),
    ...context,
  };
}

function buildResponseHeaders(context: ApiRequestContext, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('x-request-id', context.requestId);
  if (context.clientRequestId) {
    responseHeaders.set('x-kiyoko-client-request-id', context.clientRequestId);
  }
  return responseHeaders;
}

export function apiResponse(context: ApiRequestContext, response: Response) {
  const headers = buildResponseHeaders(context, response.headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function createApiRequestContext(request: Request): ApiRequestContext {
  const url = new URL(request.url);
  const clientRequestId = request.headers.get('x-kiyoko-client-request-id');

  return {
    requestId: request.headers.get('x-request-id') ?? clientRequestId ?? crypto.randomUUID(),
    clientRequestId,
    method: request.method,
    path: url.pathname,
    startedAt: Date.now(),
  };
}

export function logServerEvent(scope: string, context: ApiRequestContext, message: string, extra?: ServerLogContext) {
  console.info(`[${scope}] ${message}`, withTimestamp({
    requestId: context.requestId,
    clientRequestId: context.clientRequestId,
    method: context.method,
    path: context.path,
    durationMs: Date.now() - context.startedAt,
    ...extra,
  }));
}

export function logServerWarning(scope: string, context: ApiRequestContext, message: string, extra?: ServerLogContext) {
  console.warn(`[${scope}] ${message}`, withTimestamp({
    requestId: context.requestId,
    clientRequestId: context.clientRequestId,
    method: context.method,
    path: context.path,
    durationMs: Date.now() - context.startedAt,
    ...extra,
  }));
}

export function logServerError(scope: string, context: ApiRequestContext, error: unknown, extra?: ServerLogContext) {
  console.error(`[${scope}]`, {
    ...withTimestamp({
      requestId: context.requestId,
      clientRequestId: context.clientRequestId,
      method: context.method,
      path: context.path,
      durationMs: Date.now() - context.startedAt,
      ...extra,
    }),
    error: normalizeError(error),
  });
}

export function apiJson(context: ApiRequestContext, body: unknown, options?: ApiResponseOptions) {
  return NextResponse.json(body, {
    status: options?.status,
    headers: buildResponseHeaders(context, options?.headers),
  });
}

export function apiError(
  context: ApiRequestContext,
  scope: string,
  error: unknown,
  options?: {
    status?: number;
    message?: string;
    extra?: ServerLogContext;
    exposeDetails?: boolean;
  },
) {
  logServerError(scope, context, error, options?.extra);

  const normalized = normalizeError(error);
  return apiJson(
    context,
    {
      error: options?.message ?? 'Internal server error',
      requestId: context.requestId,
      ...(options?.exposeDetails ? { details: normalized.message } : {}),
    },
    { status: options?.status ?? 500 },
  );
}

export function apiUnauthorized(context: ApiRequestContext, message = 'Unauthorized') {
  return apiJson(context, { error: message, requestId: context.requestId }, { status: 401 });
}

export function apiBadRequest(context: ApiRequestContext, message: string) {
  return apiJson(context, { error: message, requestId: context.requestId }, { status: 400 });
}

export async function parseApiJson<T>(request: Request, context: ApiRequestContext) {
  try {
    return { data: (await request.json()) as T, response: null };
  } catch (error) {
    return {
      data: null,
      response: apiError(context, 'api-json', error, {
        status: 400,
        message: 'Invalid JSON body',
      }),
    };
  }
}