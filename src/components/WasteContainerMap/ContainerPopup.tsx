'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'
import { ContainerWithSignals } from './types'

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  full: 'Пълен',
  maintenance: 'Поддръжка',
  inactive: 'Неактивен',
  pending: 'Изчакващ',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  full: '#EF4444',
  maintenance: '#F97316',
  inactive: '#9CA3AF',
  pending: '#6B7280',
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
}

export function ContainerPopup({ container, onClose, onContainerUpdated }: ContainerPopupProps) {
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
        width: 320,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        zIndex: 1000,
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
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
                background: '#F3F4F6',
                color: '#6B7280',
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
            color: '#9CA3AF',
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
      <div style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
        {/* Capacity */}
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: '#9CA3AF' }}>Размер: </span>
          {CAPACITY_LABELS[container.capacitySize] ?? container.capacitySize}
          {container.capacityVolume != null && ` · ${container.capacityVolume} m³`}
        </div>

        {/* Address */}
        {container.address && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: '#9CA3AF' }}>Адрес: </span>
            {container.address}
          </div>
        )}

        {/* Serviced by */}
        {container.servicedBy && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: '#9CA3AF' }}>Обслужва: </span>
            {container.servicedBy}
          </div>
        )}

        {/* Signals */}
        <div
          style={{
            marginTop: 10,
            marginBottom: 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: container.activeSignalCount > 0 ? '#FEF3C7' : '#F0FDF4',
            border: `1px solid ${container.activeSignalCount > 0 ? '#FDE68A' : '#BBF7D0'}`,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            Сигнали: {container.activeSignalCount} активни / {container.signalCount} общо
          </span>
        </div>

        {/* Last cleaned */}
        {container.lastCleaned && (
          <div style={{ marginBottom: 8, color: '#6B7280', fontSize: 12 }}>
            Последно почистен: {new Date(container.lastCleaned).toLocaleString('bg-BG')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '8px 16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <Link
            href={`/admin/collections/waste-containers/${container.id}`}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 6,
              background: '#1E40AF',
              color: '#fff',
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
              background: '#F3F4F6',
              color: '#374151',
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
              background: '#065F46',
              color: '#fff',
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
                border: '1px solid #D1D5DB',
                fontSize: 13,
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            {cleanError && (
              <p style={{ color: '#DC2626', fontSize: 12, margin: 0 }}>{cleanError}</p>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleClean}
                disabled={cleanLoading}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 6,
                  background: cleanLoading ? '#9CA3AF' : '#065F46',
                  color: '#fff',
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
                  background: '#F3F4F6',
                  color: '#374151',
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
