'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from 'lucide-react'

export interface DropdownItem {
  label: string
  href: string
  external?: boolean
  icon?: React.ReactNode
}

interface DropdownMenuProps {
  label: string
  items: DropdownItem[]
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, items }) => {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors py-1"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {items.map(({ label: itemLabel, href, external, icon }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                {icon}
                {itemLabel}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                {icon}
                {itemLabel}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
}
