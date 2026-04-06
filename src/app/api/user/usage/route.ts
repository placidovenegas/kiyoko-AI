import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
} from '@/lib/observability/server';

/**
 * GET /api/user/usage
 * Return monthly usage statistics for the current user.
 */
export async function GET(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    // Get the start of the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch usage logs for the current month
    const { data: usageLogs, error: usageError } = await supabase
      .from('ai_usage_logs')
      .select('provider, model, task, input_tokens, output_tokens, total_tokens, estimated_cost_usd, response_time_ms, success, created_at')
      .eq('user_id', user.id)
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false });

    if (usageError) {
      return apiError(requestContext, 'usage/GET', usageError, {
        message: 'Failed to fetch usage data',
        extra: { userId: user.id },
      });
    }

    const logs = usageLogs ?? [];

    // Aggregate by provider
    const byProvider: Record<string, {
      requests: number;
      totalTokens: number;
      estimatedCost: number;
      avgResponseTime: number;
      successRate: number;
    }> = {};

    for (const log of logs) {
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = {
          requests: 0,
          totalTokens: 0,
          estimatedCost: 0,
          avgResponseTime: 0,
          successRate: 0,
        };
      }
      const p = byProvider[log.provider];
      p.requests++;
      p.totalTokens += log.total_tokens ?? 0;
      p.estimatedCost += log.estimated_cost_usd ?? 0;
      p.avgResponseTime += log.response_time_ms ?? 0;
      if (log.success) p.successRate++;
    }

    // Finalize averages
    for (const provider of Object.values(byProvider)) {
      if (provider.requests > 0) {
        provider.avgResponseTime = Math.round(provider.avgResponseTime / provider.requests);
        provider.successRate = Math.round((provider.successRate / provider.requests) * 100);
      }
    }

    // Aggregate by task
    const byTask: Record<string, number> = {};
    for (const log of logs) {
      byTask[log.task] = (byTask[log.task] ?? 0) + 1;
    }

    // Summary stats
    const totalRequests = logs.length;
    const totalTokens = logs.reduce((sum, l) => sum + (l.total_tokens ?? 0), 0);
    const totalCost = logs.reduce((sum, l) => sum + (l.estimated_cost_usd ?? 0), 0);
    const successCount = logs.filter((l) => l.success).length;

    return apiJson(requestContext, {
      success: true,
      usage: {
        period: {
          start: monthStart,
          end: now.toISOString(),
        },
        summary: {
          totalRequests,
          totalTokens,
          totalCost: Math.round(totalCost * 10000) / 10000,
          successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0,
        },
        byProvider,
        byTask,
        recentLogs: logs.slice(0, 50), // Last 50 logs
      },
    });
  } catch (error) {
    return apiError(requestContext, 'usage/GET', error);
  }
}
