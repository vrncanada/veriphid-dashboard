import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // snarkjs and circomlibjs use file:// URLs and native wasm loading that
  // Turbopack can't trace. Mark them as server externals so they're
  // require()'d at runtime rather than bundled.
  serverExternalPackages: ["snarkjs", "circomlibjs"],
};

export default nextConfig;
