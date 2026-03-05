-- Link manifests to users (nullable — anonymous sessions stay public)
ALTER TABLE public.manifests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Users can claim unclaimed sessions (set user_id once, from NULL)
CREATE POLICY "Claim manifest"
  ON public.manifests FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Users can also read their own manifests (on top of existing public read)
CREATE POLICY "Owner read"
  ON public.manifests FOR SELECT
  USING (user_id = auth.uid());

-- ZKP proofs
CREATE TABLE IF NOT EXISTS public.proofs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     text        NOT NULL REFERENCES public.manifests(session_id),
  user_id        uuid        NOT NULL REFERENCES auth.users(id),
  threshold      integer     NOT NULL,
  commitment     text        NOT NULL,
  proof          jsonb       NOT NULL,
  public_signals jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public proof read"
  ON public.proofs FOR SELECT USING (true);

CREATE POLICY "Owner proof write"
  ON public.proofs FOR INSERT
  WITH CHECK (user_id = auth.uid());
