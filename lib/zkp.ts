"use client"

/**
 * ZKP proof generation and verification using snarkjs + Groth16.
 * Runs entirely in the browser — the HCS score never leaves the client.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const snarkjs = typeof window !== "undefined" ? require("snarkjs") : null

export interface ProofResult {
  proof:         object
  publicSignals: string[]
  commitment:    string
}

/**
 * Generate a Groth16 proof that `score >= threshold`.
 * Private inputs (score, salt) stay in the browser.
 * Public inputs (threshold, commitment) go into the proof.
 */
export async function generateProof(score: number, threshold: number): Promise<ProofResult> {
  // Dynamic import to avoid SSR issues with snarkjs/wasm
  const { buildPoseidon } = await import("circomlibjs")
  const poseidon = await buildPoseidon()

  // Random 128-bit blinding salt
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = BigInt(
    "0x" + Array.from(saltBytes).map(b => b.toString(16).padStart(2, "0")).join("")
  )

  // Commitment = Poseidon(score, salt) — binds the private score to the proof
  const commitment: string = poseidon.F.toString(poseidon([BigInt(score), salt]))

  const { groth16 } = snarkjs
  const { proof, publicSignals } = await groth16.fullProve(
    {
      score:      BigInt(score),
      salt,
      threshold:  BigInt(threshold),
      commitment: BigInt(commitment),
    },
    "/circuits/hcs_threshold.wasm",
    "/circuits/hcs_threshold_final.zkey",
  )

  return { proof, publicSignals, commitment }
}

/**
 * Verify a stored Groth16 proof against the public signals.
 */
export async function verifyProof(proof: object, publicSignals: string[]): Promise<boolean> {
  const vk = await fetch("/circuits/verification_key.json").then(r => r.json())
  const { groth16 } = snarkjs
  return groth16.verify(vk, publicSignals, proof)
}
