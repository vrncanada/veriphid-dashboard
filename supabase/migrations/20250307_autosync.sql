-- Auto-sync: allow the extension to upsert manifests directly (no Edge Function / signing required).
-- Sessions are anonymous until a user claims them via the dashboard.

ALTER TABLE public.manifests
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Signing columns are no longer required for auto-sync sessions.
ALTER TABLE public.manifests
  ALTER COLUMN signed_at  DROP NOT NULL,
  ALTER COLUMN seal       DROP NOT NULL,
  ALTER COLUMN signature  DROP NOT NULL,
  ALTER COLUMN public_key DROP NOT NULL;

-- Extension (anon key) can INSERT new sessions.
CREATE POLICY "Anonymous insert"
  ON public.manifests FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Extension (anon key) can UPDATE any session it knows about (by UUID).
-- USING (true) allows updating claimed sessions so the extension keeps syncing
-- actions even after a user claims the session via the dashboard.
DROP POLICY IF EXISTS "Anonymous update" ON public.manifests;
CREATE POLICY "Anonymous update"
  ON public.manifests FOR UPDATE
  USING (true)
  WITH CHECK (true);
