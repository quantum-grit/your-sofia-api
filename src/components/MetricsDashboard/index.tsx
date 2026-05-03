'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { SofiaGerbMark } from '@/components/AdminBrand/SofiaGerbMark'
import { CollectionByGroupChart } from './charts/CollectionByGroupChart'
import { MonthlyTrendChart } from './charts/MonthlyTrendChart'
import { NewlyCreatedContainersChart } from './charts/NewlyCreatedContainersChart'
import { ScheduleComplianceChart } from './charts/ScheduleComplianceChart'
import { palette } from './charts/shared'
import { TimeSinceCollectionChart } from './charts/TimeSinceCollectionChart'

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

          <CollectionByGroupChart
            chartTab={chartTab}
            byZone={data.byZone}
            byDistrict={data.byDistrict}
          />
          {/* Monthly Collection Trendline (last 30 days) */}
          {!monthLoading && !monthError && monthData && (
            <MonthlyTrendChart byDay={monthData.byDay} />
          )}
          <TimeSinceCollectionChart data={data.byTimeSinceCollection} />
          <ScheduleComplianceChart compliance={data.scheduleCompliance} />
          <NewlyCreatedContainersChart />
        </>
      )}
    </div>
  )
}

export default MetricsDashboard
