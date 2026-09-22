import type { DailySignupCount } from '../../types'

interface SignupsBarChartProps {
  data: DailySignupCount[]
}

const HEIGHT = 160
const BAR_MAX_WIDTH = 24

// 단일 시리즈(일별 신규 가입자 수)이므로 범례 없이 색상 하나만 사용한다.
// (dataviz 스킬: sequential 1-hue) — 앱 전체에서 이미 쓰이는 sky 계열로 통일.
const BAR_COLOR = '#0284c7' // tailwind sky-600
const BASELINE_COLOR = '#e5e5e5' // tailwind neutral-200
const AXIS_TEXT_COLOR = '#a3a3a3' // tailwind neutral-400

export function SignupsBarChart({ data }: SignupsBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const width = data.length * 32
  const chartHeight = HEIGHT - 24 // 하단 라벨 공간 확보

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className="w-full h-40"
      preserveAspectRatio="none"
      role="img"
      aria-label="최근 14일 일별 신규 가입자 추이"
    >
      <line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke={BASELINE_COLOR} strokeWidth={1} />

      {data.map((d, i) => {
        const barHeight = Math.max(2, (d.count / max) * (chartHeight - 12))
        const slotWidth = width / data.length
        const barWidth = Math.min(BAR_MAX_WIDTH, slotWidth - 8)
        const x = i * slotWidth + (slotWidth - barWidth) / 2
        const y = chartHeight - barHeight
        const showLabel = data.length <= 14 && (i % 2 === 0 || data.length <= 7)

        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={BAR_COLOR}>
              <title>
                {d.date}: {d.count}명
              </title>
            </rect>
            {showLabel && (
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={9}
                fill={AXIS_TEXT_COLOR}
              >
                {d.date}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
