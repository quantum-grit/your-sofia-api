import React from 'react'

interface SofiaGerbMarkProps {
  size?: number
}

export function SofiaGerbMark({ size = 44 }: SofiaGerbMarkProps) {
  return (
    <img
      alt="Герб на София"
      src="/sofia-gerb.png"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  )
}
