'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

const WasteContainerMapNavLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname?.startsWith('/admin/waste-map')

  return (
    <div style={{ padding: '0 8px' }}>
      <Link
        href="/admin/waste-map"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          background: isActive ? 'var(--theme-elevation-100, rgba(0,0,0,0.05))' : 'transparent',
          color: 'var(--theme-text)',
        }}
      >
        <MapPin size={16} />
        Карта на контейнерите
      </Link>
    </div>
  )
}

export default WasteContainerMapNavLink
