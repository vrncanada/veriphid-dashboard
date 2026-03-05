import { hcsLabel, HCS_TIER_COLORS, type HCSLabel } from "@/lib/hcs"

interface BadgeChipProps {
  score: number
  size?: "sm" | "md" | "lg"
}

export function BadgeChip({ score, size = "md" }: BadgeChipProps) {
  const label: HCSLabel = hcsLabel(score)
  const color = HCS_TIER_COLORS[label]

  const padding = size === "sm" ? "px-2 py-0.5" : size === "lg" ? "px-4 py-1.5" : "px-3 py-1"
  const text    = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding} ${text}`}
      style={{ backgroundColor: color + "22", color, border: `1px solid ${color}55` }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
