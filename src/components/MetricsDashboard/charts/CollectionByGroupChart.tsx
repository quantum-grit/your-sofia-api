import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { palette } from './shared'

interface CollectionByGroupChartProps {
  chartTab: 'zone' | 'district'
  byZone: Array<{
    zoneName: string
    collectedContainers: number
    totalContainers: number
  }>
  byDistrict: Array<{
    districtName: string
    collectedContainers: number
    totalContainers: number
  }>
}

export function CollectionByGroupChart({
  chartTab,
  byZone,
  byDistrict,
}: CollectionByGroupChartProps) {
  const zoneChartData = byZone.map((zone) => ({
    name: zone.zoneName,
    collectedContainers: zone.collectedContainers,
    notCollectedContainers: zone.totalContainers - zone.collectedContainers,
  }))

  const districtChartData = byDistrict.map((district) => ({
    name: district.districtName,
    collectedContainers: district.collectedContainers,
    notCollectedContainers: district.totalContainers - district.collectedContainers,
  }))

  const title = chartTab === 'zone' ? 'By Collection Zone' : 'By Administrative District'
  const data = chartTab === 'zone' ? zoneChartData : districtChartData
  const barWidth = Math.max(360, data.length * 56)

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: palette.textPrimary }}>
        {title}
      </h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: palette.border,
            }}
          />
          <span style={{ fontSize: 12, color: palette.textSecondary }}>Total Containers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: palette.primary,
            }}
          />
          <span style={{ fontSize: 12, color: palette.textSecondary }}>Collected</span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: barWidth }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 56 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.border} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: palette.textSecondary }}
                angle={-40}
                textAnchor="end"
                interval={0}
                tickMargin={6}
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
                formatter={(value, name) =>
                  name === 'collectedContainers'
                    ? [value, 'Collected']
                    : [value, 'Total Containers']
                }
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Bar
                dataKey="collectedContainers"
                stackId="a"
                fill={palette.primary}
                name="collectedContainers"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="notCollectedContainers"
                stackId="a"
                fill={palette.border}
                name="notCollectedContainers"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
