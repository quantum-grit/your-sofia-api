'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { SofiaGerbMark } from '@/components/AdminBrand/SofiaGerbMark'
import { colors as designColors } from '@/cssVariables'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistrictStat {
  districtId: string
  districtName: string
  totalContainers: number
  collectedContainers: number
}

interface ZoneStat {
  zoneNumber: number
  zoneName: string
  serviceCompanyId: number | null
  totalContainers: number
  collectedContainers: number
}

interface TimeBucketStat {
  bucket: string
  bucketOrder: number
  containerCount: number
}

interface DailyCollectionTrend {
  date: string
  totalContainers: number
  collectedContainers: number
}

interface MetricsData {
  from: string
  to: string
  byDistrict: DistrictStat[]
  byZone: ZoneStat[]
  byDay: DailyCollectionTrend[]
  byTimeSinceCollection: TimeBucketStat[]
  scheduleCompliance: {
    scheduledToday: number
    delayed: number
    missed: number
  }
}

type Range = 'day' | 'week' | 'month'
type ChartTab = 'zone' | 'district'

function buildRange(range: Range): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now)
  if (range === 'day') from.setDate(from.getDate() - 1)
  else if (range === 'week') from.setDate(from.getDate() - 7)
  else from.setDate(from.getDate() - 30)
  return { from: from.toISOString(), to: now.toISOString() }
}

// ─── Sub-components ────────────────────────────────────────────────────────

const palette = {
  primary: designColors.primaryLight,
  primaryLight: designColors.primaryLight,
  border: `var(--theme-elevation-200, ${designColors.border})`,
  textPrimary: `var(--theme-text, ${designColors.textPrimary})`,
  textSecondary: `var(--theme-elevation-700, ${designColors.textSecondary})`,
  textMuted: `var(--theme-elevation-500, ${designColors.textMuted})`,
  success: designColors.success,
  warning: designColors.warning,
  error: designColors.error,
  surface: `var(--theme-elevation-0, ${designColors.surface})`,
  surfaceHigh: `var(--theme-elevation-50, ${designColors.surface2})`,
}

function colorByBucketOrder(order: number): string {
  if (order === 0) return palette.success
  if (order === 1) return palette.warning
  return palette.error
}

function RangeButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 20,
        border: `1px solid ${active ? palette.primaryLight : palette.border}`,
        background: active ? palette.primaryLight : palette.surface,
        color: active ? '#FFFFFF' : palette.textPrimary,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  )
}

function ChartSection({
  title,
  data,
  dataKey,
  nameKey,
  legend,
}: {
  title: string
  data: Record<string, unknown>[]
  dataKey: { collected: string; notCollected: string }
  nameKey: string
  legend: { collected: string; total: string }
}) {
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
          <span style={{ fontSize: 12, color: palette.textSecondary }}>{legend.total}</span>
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
          <span style={{ fontSize: 12, color: palette.textSecondary }}>{legend.collected}</span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: barWidth }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 56 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.border} />
              <XAxis
                dataKey={nameKey}
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
                formatter={(value, name) => [
                  value,
                  name === dataKey.collected ? legend.collected : legend.total,
                ]}
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Bar
                dataKey={dataKey.collected}
                stackId="a"
                fill={palette.primary}
                name={dataKey.collected}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey={dataKey.notCollected}
                stackId="a"
                fill={palette.border}
                name={dataKey.notCollected}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

const MetricsDashboard: React.FC = () => {
  const [range, setRange] = useState<Range>('week')
  const [chartTab, setChartTab] = useState<ChartTab>('district')
  const [data, setData] = useState<MetricsData | null>(null)
  const [monthData, setMonthData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthLoading, setMonthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthError, setMonthError] = useState<string | null>(null)

  const fetchMetrics = useCallback(
    async (
      r: Range,
      handlers: {
        onStart: () => void
        onSuccess: (result: MetricsData) => void
        onError: (message: string) => void
        onFinally: () => void
      }
    ) => {
      handlers.onStart()
      handlers.onError('')
      try {
        const { from, to } = buildRange(r)
        const res = await fetch(
          `/api/waste-containers/collection-metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        handlers.onSuccess(await res.json())
      } catch (e) {
        handlers.onError(e instanceof Error ? e.message : 'Failed to load metrics')
      } finally {
        handlers.onFinally()
      }
    },
    []
  )

  useEffect(() => {
    fetchMetrics(range, {
      onStart: () => setLoading(true),
      onSuccess: setData,
      onError: (message) => setError(message || null),
      onFinally: () => setLoading(false),
    })
  }, [range, fetchMetrics])

  useEffect(() => {
    fetchMetrics('month', {
      onStart: () => setMonthLoading(true),
      onSuccess: setMonthData,
      onError: (message) => setMonthError(message || null),
      onFinally: () => setMonthLoading(false),
    })
  }, [fetchMetrics])

  const zoneChartData = (data?.byZone ?? []).map((z) => ({
    name: z.zoneName,
    collectedContainers: z.collectedContainers,
    notCollectedContainers: z.totalContainers - z.collectedContainers,
  }))

  const districtChartData = (data?.byDistrict ?? []).map((d) => ({
    name: d.districtName,
    collectedContainers: d.collectedContainers,
    notCollectedContainers: d.totalContainers - d.collectedContainers,
  }))

  const chartData = chartTab === 'zone' ? zoneChartData : districtChartData

  const monthlyTrendData = (monthData?.byDay ?? []).slice(-30).map((day) => {
    const [, month, date] = day.date.slice(0, 10).split('-')
    return {
      day: `${date}.${month}`,
      collected: day.collectedContainers,
      total: day.totalContainers,
    }
  })

  const compliance = data?.scheduleCompliance
  const complianceData = compliance
    ? [
        {
          status: 'В график',
          count: Math.max(0, compliance.scheduledToday - compliance.delayed),
          color: palette.success,
        },
        {
          status: 'Закъснение',
          count: Math.max(0, compliance.delayed - compliance.missed),
          color: palette.warning,
        },
        {
          status: 'Пропуснати',
          count: compliance.missed,
          color: palette.error,
        },
      ]
    : []

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: palette.surfaceHigh,
          padding: '16px 20px',
          borderRadius: 12,
          marginBottom: 32,
          border: `1px solid ${palette.border}`,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <SofiaGerbMark size={48} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: palette.textPrimary }}>
              Waste Collection Metrics
            </h1>
            {data && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: palette.textSecondary }}>
                {new Date(data.from).toLocaleDateString()} –{' '}
                {new Date(data.to).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {data && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Total Containers',
              value: data.byZone.reduce((s, z) => s + z.totalContainers, 0),
              color: palette.textSecondary,
            },
            {
              label: 'Collected in Period',
              value: data.byZone.reduce((s, z) => s + z.collectedContainers, 0),
              color: palette.primary,
            },
            {
              label: 'Zones',
              value: data.byZone.length,
              color: palette.success,
            },
            {
              label: 'Districts with Data',
              value: data.byDistrict.filter((d) => d.collectedContainers > 0).length,
              color: palette.warning,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                minWidth: 150,
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading / error states */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: palette.textSecondary }}>
          Loading metrics…
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: 40, color: palette.error }}>
          <p style={{ margin: '0 0 12px' }}>Failed to load: {error}</p>
          <button
            onClick={() =>
              fetchMetrics(range, {
                onStart: () => setLoading(true),
                onSuccess: setData,
                onError: (message) => setError(message || null),
                onFinally: () => setLoading(false),
              })
            }
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: palette.primary,
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Charts */}
      {!loading && !error && data && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                backgroundColor: palette.border,
                borderRadius: 8,
                padding: 2,
                maxWidth: 320,
                width: '100%',
              }}
            >
              <button
                onClick={() => setChartTab('district')}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: chartTab === 'district' ? palette.surface : 'transparent',
                  color: chartTab === 'district' ? palette.primary : palette.textSecondary,
                  fontSize: 13,
                  fontWeight: chartTab === 'district' ? 600 : 500,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
              >
                By District
              </button>
              <button
                onClick={() => setChartTab('zone')}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: chartTab === 'zone' ? palette.surface : 'transparent',
                  color: chartTab === 'zone' ? palette.primary : palette.textSecondary,
                  fontSize: 13,
                  fontWeight: chartTab === 'zone' ? 600 : 500,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
              >
                By Zone
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <RangeButton
                label="Last Day"
                active={range === 'day'}
                onClick={() => setRange('day')}
              />
              <RangeButton
                label="Last Week"
                active={range === 'week'}
                onClick={() => setRange('week')}
              />
              <RangeButton
                label="Last Month"
                active={range === 'month'}
                onClick={() => setRange('month')}
              />
            </div>
          </div>

          <ChartSection
            title={chartTab === 'zone' ? 'By Collection Zone' : 'By Administrative District'}
            data={chartData}
            dataKey={{ collected: 'collectedContainers', notCollected: 'notCollectedContainers' }}
            nameKey="name"
            legend={{ collected: 'Collected', total: 'Total Containers' }}
          />
          {/* Time-since-last-collection histogram */}
          <div style={{ marginBottom: 48 }}>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 12,
                color: palette.textPrimary,
              }}
            >
              Time Since Last Collection
            </h3>
            <p
              style={{
                fontSize: 13,
                color: palette.textSecondary,
                marginBottom: 16,
                marginTop: -8,
              }}
            >
              Distribution of containers by time elapsed since their most recent collection event.
            </p>
            {data.byTimeSinceCollection.length === 0 ? (
              <p style={{ color: palette.textMuted, fontSize: 14 }}>
                No collection data available yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 400 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={data.byTimeSinceCollection.map((b) => ({
                        bucket: b.bucket,
                        containers: b.containerCount,
                      }))}
                      margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={palette.border}
                      />
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
                        formatter={(value) => [value, 'Containers']}
                      />
                      <Bar dataKey="containers" fill={palette.success} radius={[4, 4, 0, 0]}>
                        {data.byTimeSinceCollection.map((bucket) => (
                          <Cell key={bucket.bucket} fill={colorByBucketOrder(bucket.bucketOrder)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Collection Trendline (last 30 days) */}
          {!monthLoading && !monthError && monthData && (
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
              {monthlyTrendData.length === 0 ? (
                <p style={{ color: palette.textMuted, fontSize: 14 }}>
                  No collection data available yet.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div
                    style={{ minWidth: Math.max(560, monthlyTrendData.length * 30), height: 320 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={monthlyTrendData}
                        margin={{ top: 16, right: 16, left: 0, bottom: 64 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={palette.border}
                        />
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
                          formatter={(value, name) => [
                            value,
                            name === 'collected' ? 'Collected Containers' : 'Total Containers',
                          ]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 12 }}
                          formatter={(value) =>
                            value === 'collected' ? (
                              <span style={{ color: palette.textSecondary }}>
                                Collected Containers
                              </span>
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
          )}

          {/* Schedule compliance */}
          <div style={{ marginBottom: 48 }}>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 12,
                color: palette.textPrimary,
              }}
            >
              Изпълнение на графика
            </h3>
            {complianceData.length === 0 ? (
              <p style={{ color: palette.textMuted, fontSize: 14 }}>Няма налични данни.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  {complianceData.map((item) => (
                    <div
                      key={item.status}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor: item.color,
                        }}
                      />
                      <span style={{ fontSize: 12, color: palette.textSecondary }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 400, height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={complianceData}
                        margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={palette.border}
                        />
                        <XAxis
                          dataKey="status"
                          tick={{ fontSize: 11, fill: palette.textSecondary }}
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
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {complianceData.map((item) => (
                            <Cell key={item.status} fill={item.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default MetricsDashboard
