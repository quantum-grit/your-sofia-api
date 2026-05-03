import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { colorByBucketOrder, palette } from './shared'

interface TimeSinceCollectionChartProps {
  data: Array<{
    bucket: string
    bucketOrder: number
    containerCount: number
  }>
}

export function TimeSinceCollectionChart({ data }: TimeSinceCollectionChartProps) {
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
        Време от последното събиране
      </h3>
      <p
        style={{
          fontSize: 13,
          color: palette.textSecondary,
          marginBottom: 16,
          marginTop: -8,
        }}
      >
        Разпределение на контейнерите според времето, изминало от последното им събитие за събиране.
      </p>
      {data.length === 0 ? (
        <p style={{ color: palette.textMuted, fontSize: 14 }}>
          Все още няма налични данни за събирания.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 400 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.map((bucket) => ({
                  bucket: bucket.bucket,
                  containers: bucket.containerCount,
                }))}
                margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.border} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 12, fill: palette.textSecondary }}
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
                  cursor={{ fill: 'transparent', stroke: palette.border, strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 10,
                    color: palette.textPrimary,
                  }}
                  labelStyle={{ color: palette.textPrimary }}
                  itemStyle={{ color: palette.textPrimary }}
                  formatter={(value) => [value, 'Контейнери']}
                />
                <Bar dataKey="containers" fill={palette.success} radius={[4, 4, 0, 0]}>
                  {data.map((bucket) => (
                    <Cell key={bucket.bucket} fill={colorByBucketOrder(bucket.bucketOrder)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
