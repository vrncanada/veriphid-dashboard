declare module "circomlibjs" {
  export function buildPoseidon(): Promise<{
    (inputs: bigint[]): Uint8Array
    F: { toString(v: Uint8Array): string }
  }>
}
