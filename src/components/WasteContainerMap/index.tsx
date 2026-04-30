'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Bounds,
  ContainerWithSignals,
  EMPTY_FILTERS,
  FilterState,
  MapItem,
  MarkerPoint,
  applyFilters,
} from './types'
import { MapFilters } from './MapFilters'
import { ContainerPopup } from './ContainerPopup'
import { BulkActionBar } from './BulkActionBar'
import { CreatePinHint } from './CreatePinHint'

// Dynamically import the map to avoid SSR issues
const ContainerMap = dynamic(
  () => import('./ContainerMap').then((m) => ({ default: m.ContainerMap })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6B7280',
          fontSize: 14,
        }}
      >
        Зареждане на картата…
      </div>
    ),
  }
)

interface NewPinLocation {
  lat: number
  lng: number
  screenX: number
  screenY: number
}

const WasteContainerMapView: React.FC = () => {
  const [items, setItems] = useState<MapItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [selectedContainer, setSelectedContainer] = useState<ContainerWithSignals | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [newPin, setNewPin] = useState<NewPinLocation | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async (zoom: number, bounds: Bounds) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        zoom: String(zoom),
        minLat: String(bounds.minLat),
        maxLat: String(bounds.maxLat),
        minLng: String(bounds.minLng),
        maxLng: String(bounds.maxLng),
      })
      const res = await fetch(`/api/waste-containers/containers-with-signal-count?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.docs ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неуспешно зареждане')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleViewportChange = useCallback(
    (zoom: number, bounds: Bounds) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchData(zoom, bounds), 300)
    },
    [fetchData]
  )

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  const isClustered = items.length > 0 && items[0]?.type === 'cluster'
  const markers = useMemo(() => items.filter((i): i is MarkerPoint => i.type === 'marker'), [items])
  const filtered = useMemo(() => applyFilters(markers, filters), [markers, filters])
  const displayItems = useMemo<MapItem[]>(
    () => (isClustered ? items : filtered),
    [isClustered, items, filtered]
  )

  const handleMarkerClick = useCallback(
    (container: ContainerWithSignals) => {
      if (selectMode) {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(container.id)) next.delete(container.id)
          else next.add(container.id)
          return next
        })
      } else {
        setSelectedContainer(container)
        setNewPin(null)
      }
    },
    [selectMode]
  )

  const handleMapClick = useCallback(
    (lat: number, lng: number, screenX: number, screenY: number) => {
      if (!selectMode) {
        setSelectedContainer(null)
        setNewPin({ lat, lng, screenX, screenY })
      }
    },
    [selectMode]
  )

  const handleContainerUpdated = useCallback((updated: ContainerWithSignals) => {
    setItems((prev) =>
      prev.map((item) =>
        item.type === 'marker' && item.id === updated.id
          ? { ...updated, type: 'marker' as const }
          : item
      )
    )
    setSelectedContainer(updated)
  }, [])

  const handleBulkUpdate = useCallback(async (ids: number[], status: string) => {
    const res = await fetch('/api/waste-containers/bulk-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    setItems((prev) =>
      prev.map((item) =>
        item.type === 'marker' && ids.includes(item.id)
          ? { ...item, status: status as ContainerWithSignals['status'] }
          : item
      )
    )
    setSelectedIds(new Set())
    setSelectMode(false)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--theme-elevation-200, #E5E7EB)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--theme-bg)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--theme-text)' }}>
            Карта на контейнерите за отпадъци
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280', minHeight: '1.4em' }}>
            {items.length > 0
              ? isClustered
                ? `${items.length} кластера — приближете за детайли`
                : `${filtered.length} от ${markers.length} контейнера`
              : '\u00a0'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isClustered && (
            <button
              onClick={() => {
                setSelectMode((v) => !v)
                setSelectedIds(new Set())
                setSelectedContainer(null)
                setNewPin(null)
              }}
              style={{
                padding: '7px 14px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                background: selectMode ? '#1E40AF' : '#fff',
                color: selectMode ? '#fff' : '#374151',
                fontWeight: selectMode ? 600 : 400,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {selectMode ? 'Отказ от избор' : 'Масов избор'}
            </button>
          )}
        </div>
      </div>

      {/* Filters — only meaningful in individual marker mode */}
      {!isClustered && <MapFilters filters={filters} onChange={setFilters} />}

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onStatusChange={(status: string) => handleBulkUpdate(Array.from(selectedIds), status)}
          onCancel={() => {
            setSelectedIds(new Set())
            setSelectMode(false)
          }}
        />
      )}

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 500,
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              fontSize: 12,
              padding: '3px 9px',
              borderRadius: 6,
              pointerEvents: 'none',
            }}
          >
            Зареждане…
          </div>
        )}
        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              zIndex: 500,
              gap: 12,
            }}
          >
            <p style={{ color: '#DC2626', margin: 0 }}>Грешка: {error}</p>
          </div>
        )}
        {!error && (
          <ContainerMap
            items={displayItems}
            selectedIds={selectedIds}
            selectMode={selectMode}
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick}
            onViewportChange={handleViewportChange}
          />
        )}

        {/* Popup overlay */}
        {selectedContainer && !selectMode && (
          <ContainerPopup
            container={selectedContainer}
            onClose={() => setSelectedContainer(null)}
            onContainerUpdated={handleContainerUpdated}
          />
        )}

        {/* Create pin hint */}
        {newPin && !selectMode && (
          <CreatePinHint
            lat={newPin.lat}
            lng={newPin.lng}
            screenX={newPin.screenX}
            screenY={newPin.screenY}
            onDismiss={() => setNewPin(null)}
          />
        )}
      </div>
    </div>
  )
}

export default WasteContainerMapView
