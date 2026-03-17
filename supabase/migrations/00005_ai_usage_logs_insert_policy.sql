-- Add INSERT policy for ai_usage_logs so users can log their own AI usage.
-- Previously only SELECT and admin ALL policies existed, causing INSERT to fail
-- for regular authenticated users.
CREATE POLICY "Users insert own logs"
  ON public.ai_usage_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
