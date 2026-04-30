'use client'

import React, { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Активен' },
  { value: 'full', label: 'Пълен' },
  { value: 'maintenance', label: 'Поддръжка' },
  { value: 'inactive', label: 'Неактивен' },
  { value: 'pending', label: 'Изчакващ' },
]

interface BulkActionBarProps {
  count: number
  onStatusChange: (status: string) => Promise<void>
  onCancel: () => void
}

export function BulkActionBar({ count, onStatusChange, onCancel }: BulkActionBarProps) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!status) return
    setLoading(true)
    setError(null)
    try {
      await onStatusChange(status)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 24px',
        background: '#EFF6FF',
        borderBottom: '1px solid #BFDBFE',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>
        {count} избрани контейнера
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#374151' }}>Промени статус на:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #D1D5DB',
            fontSize: 12,
            background: '#fff',
          }}
        >
          <option value="">— Избери —</option>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={handleConfirm}
          disabled={!status || loading}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            background: !status || loading ? '#9CA3AF' : '#1E40AF',
            color: '#fff',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: !status || loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Обработва се…' : 'Приложи'}
        </button>
      </div>
      {error && <span style={{ color: '#DC2626', fontSize: 12 }}>{error}</span>}
      <button
        onClick={onCancel}
        style={{
          marginLeft: 'auto',
          padding: '5px 12px',
          borderRadius: 6,
          border: '1px solid #D1D5DB',
          background: '#fff',
          fontSize: 12,
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        Отказ
      </button>
    </div>
  )
}
