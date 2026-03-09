'use client'

import { useAuth, useForm, useFormFields } from '@payloadcms/ui'
import dynamic from 'next/dynamic'
import React, { useCallback, useRef } from 'react'
import './index.scss'

// Dynamically import the Leaflet map to avoid SSR issues (Leaflet requires `window`)
const LeafletMap = dynamic(
  () => import('./LeafletMap').then((mod) => ({ default: mod.LeafletMap })),
  {
    ssr: false,
    loading: () => <div className="location-map-field__loading">Зареждане на картата…</div>,
  }
)

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'Accept-Language': 'bg',
          'User-Agent': 'YourSofia-Admin/1.0',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data as { display_name?: string }).display_name ?? null
  } catch {
    return null
  }
}

export function LocationMapComponent() {
  const { user } = useAuth()
  const { dispatchFields } = useForm()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canEdit = user != null && (user.role === 'admin' || user.role === 'containerAdmin')

  // location is stored as [longitude, latitude] (PostGIS point format)
  const locationValue = useFormFields(([fields]) => fields['location']?.value) as
    | [number, number]
    | null
    | undefined

  const lng = Array.isArray(locationValue) ? locationValue[0] : null
  const lat = Array.isArray(locationValue) ? locationValue[1] : null

  const handlePositionChange = useCallback(
    (newLat: number, newLng: number) => {
      if (!canEdit) return

      // Update the location field (PostGIS format: [lng, lat])
      dispatchFields({
        type: 'UPDATE',
        path: 'location',
        value: [newLng, newLat],
      })

      // Debounce reverse geocoding to respect Nominatim's rate limits
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        const address = await reverseGeocode(newLat, newLng)
        if (address) {
          dispatchFields({
            type: 'UPDATE',
            path: 'address',
            value: address,
          })
        }
      }, 600)
    },
    [canEdit, dispatchFields]
  )

  return (
    <div className="location-map-field">
      {canEdit && (
        <p className="location-map-field__hint">
          Плъзнете маркера или кликнете на картата, за да промените местоположението. Адресното поле
          ще се актуализира автоматично.
        </p>
      )}
      <div className="location-map-field__map">
        <LeafletMap
          lat={lat ?? null}
          lng={lng ?? null}
          canEdit={canEdit}
          onPositionChange={handlePositionChange}
        />
      </div>
      {lat !== null && lng !== null && (
        <p className="location-map-field__coords">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
