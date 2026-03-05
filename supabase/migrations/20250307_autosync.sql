-- Auto-sync: allow the extension to upsert manifests directly (no Edge Function / signing required).
-- Sessions are anonymous until a user claims them via the dashboard.

ALTER TABLE public.manifests
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Extension (anon key) can INSERT new sessions.
CREATE POLICY "Anonymous insert"
  ON public.manifests FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Extension (anon key) can UPDATE actions on unclaimed sessions (keeps accumulating actions).
CREATE POLICY "Anonymous update"
  ON public.manifests FOR UPDATE
  USING  (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
