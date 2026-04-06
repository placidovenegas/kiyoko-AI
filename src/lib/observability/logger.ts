type LogContext = Record<string, unknown>;

export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      name: typeof candidate.name === 'string' ? candidate.name : 'UnknownError',
      message: typeof candidate.message === 'string' ? candidate.message : JSON.stringify(candidate),
      code: candidate.code,
      details: candidate.details,
      hint: candidate.hint,
      status: candidate.status,
    };
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : 'Unexpected error',
  };
}

function withTimestamp(context?: LogContext) {
  return {
    timestamp: new Date().toISOString(),
    ...context,
  };
}

export function logClientEvent(scope: string, message: string, context?: LogContext) {
  console.info(`[${scope}] ${message}`, withTimestamp(context));
}

export function logClientWarning(scope: string, message: string, context?: LogContext) {
  console.warn(`[${scope}] ${message}`, withTimestamp(context));
}

export function logClientError(scope: string, error: unknown, context?: LogContext) {
  console.error(`[${scope}]`, {
    ...withTimestamp(context),
    error: normalizeError(error),
  });
}
