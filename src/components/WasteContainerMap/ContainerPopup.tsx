'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'
import { colors } from '@/cssVariables'
import { ContainerWithSignals } from './types'

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  full: 'Пълен',
  maintenance: 'Поддръжка',
  inactive: 'Неактивен',
  pending: 'Изчакващ',
}

const STATUS_COLORS: Record<string, string> = {
  active: colors.success,
  full: colors.error,
  maintenance: colors.warning,
  inactive: colors.textMuted,
  pending: colors.textSecondary,
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  general: 'Общи',
  recyclables: 'Рециклируеми',
  organic: 'Органични',
  glass: 'Стъкло',
  paper: 'Хартия',
  plastic: 'Пластмаса',
  metal: 'Метал',
  trashCan: 'Кош',
}

const CAPACITY_LABELS: Record<string, string> = {
  tiny: 'Много малък',
  small: 'Малък',
  standard: 'Стандартен',
  big: 'Голям',
  industrial: 'Промишлен',
}

interface ContainerPopupProps {
  container: ContainerWithSignals
  onClose: () => void
  onContainerUpdated: (updated: ContainerWithSignals) => void
  onBeforeEdit?: () => void
}

export function ContainerPopup({
  container,
  onClose,
  onContainerUpdated,
  onBeforeEdit,
}: ContainerPopupProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'containerAdmin'

  const [cleaning, setCleaning] = useState(false)
  const [cleanNotes, setCleanNotes] = useState('')
  const [cleanError, setCleanError] = useState<string | null>(null)
  const [cleanLoading, setCleanLoading] = useState(false)

  const showCleanButton = isAdmin && (container.status !== 'active' || !container.lastCleaned)

  const handleClean = async () => {
    setCleanLoading(true)
    setCleanError(null)
    try {
      const body = new FormData()
      if (cleanNotes) body.append('notes', cleanNotes)
      const res = await fetch(`/api/waste-containers/${container.id}/clean`, {
        method: 'POST',
        body,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      onContainerUpdated({
        ...container,
        status: 'active',
        lastCleaned: data.container?.lastCleaned ?? new Date().toISOString(),
        activeSignalCount: 0,
      })
      setCleaning(false)
      setCleanNotes('')
    } catch (e) {
      setCleanError(e instanceof Error ? e.message : 'Неуспешно почистване')
    } finally {
      setCleanLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 350,
        background: colors.surface,
        borderRadius: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        zIndex: 1000,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: `1px solid ${colors.surface2}`,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: colors.textPrimary }}>
            {container.publicNumber}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: STATUS_COLORS[container.status] + '20',
                color: STATUS_COLORS[container.status],
                border: `1px solid ${STATUS_COLORS[container.status]}40`,
              }}
            >
              {STATUS_LABELS[container.status] ?? container.status}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: colors.surface2,
                color: colors.textSecondary,
              }}
            >
              {WASTE_TYPE_LABELS[container.wasteType] ?? container.wasteType}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: 20,
            lineHeight: 1,
            padding: 0,
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 12px', fontSize: 13, color: colors.textSecondary }}>
        {/* Signals */}
        <div
          style={{
            marginTop: 2,
            marginBottom: 2,
            padding: '8px 10px',
          }}
        >
          <span style={{ fontWeight: 600 }}>
            Сигнали: {container.activeSignalCount} активни / {container.signalCount} общо
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            padding: '10px',
            borderRadius: 8,
            background: colors.surface2,
            border: `1px solid ${colors.border}`,
            display: 'grid',
            gap: 5,
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ color: colors.textMuted }}>ID: </span>
            {container.id}
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Статус: </span>
            {STATUS_LABELS[container.status] ?? container.status}
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Вид отпадък: </span>
            {WASTE_TYPE_LABELS[container.wasteType] ?? container.wasteType}
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Размер: </span>
            {CAPACITY_LABELS[container.capacitySize] ?? container.capacitySize}
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Обем: </span>
            {container.capacityVolume} m³
          </div>
          {container.address && (
            <div>
              <span style={{ color: colors.textMuted }}>Адрес: </span>
              {container.address}
            </div>
          )}
          {container.servicedBy && (
            <div>
              <span style={{ color: colors.textMuted }}>Обслужва: </span>
              {container.servicedBy}
            </div>
          )}
          <div>
            <span style={{ color: colors.textMuted }}>Последно почистен: </span>
            {container.lastCleaned && new Date(container.lastCleaned).toLocaleString('bg-BG')}
          </div>
          {container.legacyId && (
            <div>
              <span style={{ color: colors.textMuted }}>Legacy ID: </span>
              {container.legacyId}
            </div>
          )}
          {container.imageId != null && (
            <div>
              <span style={{ color: colors.textMuted }}>Снимка ID: </span>
              {container.imageId}
            </div>
          )}
          <div>
            <span style={{ color: colors.textMuted }}>Координати: </span>
            {container.location[1].toFixed(6)}, {container.location[0].toFixed(6)}
          </div>
          {container.binCount != null && (
            <div>
              <span style={{ color: colors.textMuted }}>Брой съдове: </span>
              {container.binCount}
            </div>
          )}
          {container.districtId != null && (
            <div>
              <span style={{ color: colors.textMuted }}>Район ID: </span>
              {container.districtId}
            </div>
          )}
          {container.notes && (
            <div>
              <span style={{ color: colors.textMuted }}>Бележки: </span>
              {container.notes}
            </div>
          )}
          <div>
            <span style={{ color: colors.textMuted }}>Създаден: </span>
            {new Date(container.createdAt).toLocaleString('bg-BG')}
          </div>
          <div>
            <span style={{ color: colors.textMuted }}>Обновен: </span>
            {new Date(container.updatedAt).toLocaleString('bg-BG')}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '8px 16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          borderTop: `1px solid ${colors.surface2}`,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <Link
            href={`/admin/collections/waste-containers/${container.id}`}
            onClick={onBeforeEdit}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 6,
              background: colors.primaryDark,
              color: colors.surface,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Редактирай
          </Link>
          <Link
            href={`/admin/collections/signals?where[cityObjectReferenceId][equals]=${encodeURIComponent(container.publicNumber)}`}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 6,
              background: colors.surface2,
              color: colors.textSecondary,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Сигнали
          </Link>
        </div>

        {showCleanButton && !cleaning && (
          <button
            onClick={() => setCleaning(true)}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: 6,
              background: colors.success,
              color: colors.surface,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Маркирай като почистен
          </button>
        )}

        {cleaning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              placeholder="Бележки (по желание)"
              value={cleanNotes}
              onChange={(e) => setCleanNotes(e.target.value)}
              rows={2}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                fontSize: 13,
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            {cleanError && (
              <p style={{ color: colors.error, fontSize: 12, margin: 0 }}>{cleanError}</p>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleClean}
                disabled={cleanLoading}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 6,
                  background: cleanLoading ? colors.textMuted : colors.success,
                  color: colors.surface,
                  fontSize: 13,
                  border: 'none',
                  cursor: cleanLoading ? 'default' : 'pointer',
                }}
              >
                {cleanLoading ? 'Изпраща се…' : 'Потвърди'}
              </button>
              <button
                onClick={() => {
                  setCleaning(false)
                  setCleanNotes('')
                  setCleanError(null)
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  background: colors.surface2,
                  color: colors.textSecondary,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Отказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
