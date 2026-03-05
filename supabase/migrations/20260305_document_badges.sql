-- Document Badge / Notarization (Milestone 7)
-- Creates tables for extension auth bridge, workspaces, and document badges.
-- Apply via Supabase SQL Editor.

-- ============================================================
-- link_tokens — extension ↔ dashboard auth bridge
-- Extension inserts a placeholder row (anon), dashboard completes it with a JWT,
-- extension polls /api/extension-token until the JWT is available (single-use).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.link_tokens (
  token         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id),
  access_token  text,
  refresh_token text,
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon create link token"
  ON public.link_tokens FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Auth complete link token"
  ON public.link_tokens FOR UPDATE
  USING (true)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Read link token"
  ON public.link_tokens FOR SELECT
  USING (true);

CREATE POLICY "Delete link token"
  ON public.link_tokens FOR DELETE
  USING (true);

-- ============================================================
-- workspaces — employer creates a workspace, shares invite_code with employees
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  invite_code text        NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  owner_id    uuid        NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Create workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- NOTE: "Read workspace as member" is added AFTER workspace_members is created (see below).
CREATE POLICY "Owner read workspace"
  ON public.workspaces FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owner update workspace"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================================
-- workspace_members — employees who have joined a workspace via invite code
-- Must be created before the member-referencing workspace SELECT policy.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Simple: each user sees only their own membership rows.
-- Do NOT self-reference workspace_members here — causes infinite recursion.
CREATE POLICY "Read workspace members"
  ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Join workspace"
  ON public.workspace_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Now workspace_members exists — add the member-visibility policy to workspaces.
CREATE POLICY "Member read workspace"
  ON public.workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- document_badges — signed provenance badge tied to a specific document
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_badges (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id),
  workspace_id uuid        REFERENCES public.workspaces(id),
  session_id   text        NOT NULL REFERENCES public.manifests(session_id),
  doc_title    text        NOT NULL,
  doc_url      text        NOT NULL,
  doc_url_hash text        NOT NULL,   -- SHA-256 of normalized URL (dedup without PII index)
  hcs          integer     NOT NULL,
  hcs_label    text        NOT NULL,
  seal         text,                   -- copied from manifests.seal
  signature    text,                   -- Ed25519 base64
  public_key   text,                   -- base64 raw public key
  badged_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id, doc_url_hash)
);
ALTER TABLE public.document_badges ENABLE ROW LEVEL SECURITY;

-- Owner can read/write their own badges
CREATE POLICY "Owner badge access"
  ON public.document_badges
  USING (user_id = auth.uid());

CREATE POLICY "Owner badge insert"
  ON public.document_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Workspace members can read badges submitted to their shared workspace
CREATE POLICY "Workspace member badge read"
  ON public.document_badges FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Public: anyone with a badge ID can read it (for employer verify link)
CREATE POLICY "Public badge read by id"
  ON public.document_badges FOR SELECT
  USING (true);
