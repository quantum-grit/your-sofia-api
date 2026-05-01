'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { colors } from '@/cssVariables'
import { Bounds, ClusterPoint, ContainerWithSignals, MapItem, getMarkerColor } from './types'

// Fix Leaflet's broken default marker icons when bundled with webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl']
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SOFIA_LAT = 42.6977
const SOFIA_LNG = 23.3219

function createColorIcon(color: string, selected: boolean): L.DivIcon {
  const size = selected ? 18 : 14
  const border = selected ? `3px solid ${colors.primaryDark}` : '2px solid rgba(0,0,0,0.3)'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:${border};
      box-shadow:0 1px 3px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createClusterIcon(cluster: ClusterPoint): L.DivIcon {
  const { count, dominantStatus, activeSignalCount } = cluster
  const color =
    dominantStatus === 'inactive' || dominantStatus === 'pending'
      ? colors.textMuted
      : activeSignalCount > 0
        ? colors.warning
        : dominantStatus === 'full' || dominantStatus === 'maintenance'
          ? colors.error
          : colors.success
  const size = count >= 1000 ? 52 : count >= 100 ? 44 : count >= 10 ? 36 : 28
  const label = count >= 1000 ? `${Math.floor(count / 1000)}k+` : String(count)
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${size >= 44 ? 13 : 11}px;
      font-family:sans-serif;
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number, screenX: number, screenY: number) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const mapRef = useRef<L.Map | null>(null)
  useMapEvents({
    load(e) {
      mapRef.current = e.target
    },
    click(e) {
      const orig = e.originalEvent as MouseEvent
      onMapClick(e.latlng.lat, e.latlng.lng, orig.clientX, orig.clientY)
    },
  })
  return null
}

function ViewportTracker({
  onViewportChange,
}: {
  onViewportChange: (zoom: number, bounds: Bounds) => void
}) {
  const map = useMap()

  useEffect(() => {
    const b = map.getBounds()
    onViewportChange(map.getZoom(), {
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLng: b.getWest(),
      maxLng: b.getEast(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMapEvents({
    moveend(e) {
      const b = e.target.getBounds()
      onViewportChange(e.target.getZoom(), {
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      })
    },
    zoomend(e) {
      const b = e.target.getBounds()
      onViewportChange(e.target.getZoom(), {
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      })
    },
  })
  return null
}

/**
 * MarkersLayer — uses two Leaflet LayerGroups (double-buffer) to swap marker sets
 * without ever leaving the map blank. While the front group stays visible, the back
 * group is populated with the new markers. Then both are swapped in one synchronous
 * JS call so there is no empty frame.
 */
function MarkersLayer({
  items,
  selectedIds,
  onMarkerClick,
}: {
  items: MapItem[]
  selectedIds: Set<number>
  onMarkerClick: (container: ContainerWithSignals) => void
}) {
  const map = useMap()
  const groupsRef = useRef<[L.LayerGroup, L.LayerGroup]>([L.layerGroup(), L.layerGroup()])
  const frontRef = useRef<0 | 1>(0)
  // Keep a stable ref to the callback so marker closures always call the latest version
  const onMarkerClickRef = useRef(onMarkerClick)
  onMarkerClickRef.current = onMarkerClick

  // Mount / unmount both groups with the map lifetime
  useEffect(() => {
    const [g0] = groupsRef.current
    g0.addTo(map)
    return () => {
      groupsRef.current[0].remove()
      groupsRef.current[1].remove()
    }
  }, [map])

  // Whenever items or selection changes, rebuild the back group then swap
  useEffect(() => {
    const groups = groupsRef.current
    const front = frontRef.current
    const back: 0 | 1 = front === 0 ? 1 : 0
    const backGroup = groups[back]

    // Populate back group while it is off the map
    backGroup.clearLayers()
    items.forEach((item) => {
      if (item.type === 'cluster') {
        const marker = L.marker([item.lat, item.lng], { icon: createClusterIcon(item) })
        marker.on('click', () => map.setView([item.lat, item.lng], map.getZoom() + 3))
        backGroup.addLayer(marker)
      } else {
        const [lng, lat] = item.location
        const color = getMarkerColor(item)
        const selected = selectedIds.has(item.id)
        const marker = L.marker([lat, lng], { icon: createColorIcon(color, selected) })
        marker.on('click', () => onMarkerClickRef.current(item))
        backGroup.addLayer(marker)
      }
    })

    // Atomic swap — synchronous, so no blank frame between the two operations
    backGroup.addTo(map)
    groups[front].remove()
    frontRef.current = back
  }, [items, selectedIds, map])

  return null
}

interface ContainerMapProps {
  items: MapItem[]
  selectedIds: Set<number>
  selectMode: boolean
  onMarkerClick: (container: ContainerWithSignals) => void
  onMapClick: (lat: number, lng: number, screenX: number, screenY: number) => void
  onViewportChange: (zoom: number, bounds: Bounds) => void
}

export function ContainerMap({
  items,
  selectedIds,
  selectMode,
  onMarkerClick,
  onMapClick,
  onViewportChange,
}: ContainerMapProps) {
  const handleMapClick = useCallback(
    (lat: number, lng: number, screenX: number, screenY: number) => {
      onMapClick(lat, lng, screenX, screenY)
    },
    [onMapClick]
  )

  return (
    <MapContainer
      center={[SOFIA_LAT, SOFIA_LNG]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={handleMapClick} />
      <ViewportTracker onViewportChange={onViewportChange} />
      <MarkersLayer items={items} selectedIds={selectedIds} onMarkerClick={onMarkerClick} />
    </MapContainer>
  )
}
