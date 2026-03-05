"use client"

import { hcsLabel, HCS_TIER_COLORS } from "@/lib/hcs"

interface HCSGaugeProps {
  score: number
  size?: number
}

/**
 * Semicircular HCS gauge — exact visual port from the extension popup.
 */
export function HCSGauge({ score, size = 160 }: HCSGaugeProps) {
  const label = hcsLabel(score)
  const color = HCS_TIER_COLORS[label]

  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.38
  const strokeW = size * 0.08

  // Arc from 180° to 0° (left to right), fraction = score/100
  const fraction  = score / 100
  const startAngle = Math.PI          // 180°
  const endAngle   = Math.PI - fraction * Math.PI

  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArc = fraction > 0.5 ? 1 : 0

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Fill */}
        {score > 0 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={size * 0.2}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
      </svg>
    </div>
  )
}
