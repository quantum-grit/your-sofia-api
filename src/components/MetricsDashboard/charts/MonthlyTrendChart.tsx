import React from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { palette } from './shared'

interface MonthlyTrendChartProps {
  byDay: Array<{
    date: string
    collectedContainers: number
    totalContainers: number
  }>
}

export function MonthlyTrendChart({ byDay }: MonthlyTrendChartProps) {
  const data = byDay.slice(-30).map((day) => {
    const [, month, date] = day.date.slice(0, 10).split('-')
    return {
      day: `${date}.${month}`,
      collected: day.collectedContainers,
      total: day.totalContainers,
    }
  })

  return (
    <div style={{ marginBottom: 48 }}>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 12,
          color: palette.textPrimary,
        }}
      >
        Collection Trendline - Last 30 Days
      </h3>
      {data.length === 0 ? (
        <p style={{ color: palette.textMuted, fontSize: 14 }}>No collection data available yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(560, data.length * 30), height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 64 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.border} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: palette.textSecondary }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tickMargin={8}
                  axisLine={{ stroke: palette.border }}
                  tickLine={{ stroke: palette.border }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: palette.textSecondary }}
                  axisLine={{ stroke: palette.border }}
                  tickLine={{ stroke: palette.border }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent', stroke: palette.border, strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 10,
                    color: palette.textPrimary,
                  }}
                  labelStyle={{ color: palette.textPrimary }}
                  itemStyle={{ color: palette.textPrimary }}
                  formatter={(value, name) =>
                    name === 'collected'
                      ? [value, 'Collected Containers']
                      : [value, 'Total Containers']
                  }
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) =>
                    value === 'collected' ? (
                      <span style={{ color: palette.textSecondary }}>Collected Containers</span>
                    ) : (
                      <span style={{ color: palette.textSecondary }}>Total Containers</span>
                    )
                  }
                />
                <Bar dataKey="collected" fill={palette.primary} radius={[3, 3, 0, 0]} />
                <Line
                  type="linear"
                  dataKey="total"
                  stroke={palette.success}
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
