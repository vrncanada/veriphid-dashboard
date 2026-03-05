"use client"

import { ProofCard } from "@/components/ProofCard"
import { generateProof } from "@/lib/zkp"
import type { ProofRow } from "@/lib/supabase"
import { createClient } from "@/lib/supabase"

interface Props {
  sessionId:     string
  hcsScore:      number
  existingProof: ProofRow | null | undefined
}

export function SessionZKPPanel({ sessionId, hcsScore, existingProof }: Props) {
  const handleGenerate = async (threshold: number) => {
    const { proof, publicSignals, commitment } = await generateProof(hcsScore, threshold)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase.from("proofs").insert({
      session_id:     sessionId,
      user_id:        user.id,
      threshold,
      commitment,
      proof,
      public_signals: publicSignals,
    })

    if (error) throw new Error(error.message)
  }

  return (
    <ProofCard
      sessionId={sessionId}
      hcsScore={hcsScore}
      existingProof={existingProof}
      onGenerate={handleGenerate}
    />
  )
}
