export interface ContainerWithSignals {
  id: number
  publicNumber: string
  legacyId?: string | null
  imageId?: number | null
  location: [number, number] // [lng, lat]
  capacitySize: 'tiny' | 'small' | 'standard' | 'big' | 'industrial'
  capacityVolume: number
  wasteType:
    | 'general'
    | 'recyclables'
    | 'organic'
    | 'glass'
    | 'paper'
    | 'plastic'
    | 'metal'
    | 'trashCan'
  status: 'active' | 'full' | 'maintenance' | 'inactive' | 'pending'
  address?: string | null
  notes?: string | null
  servicedBy?: string | null
  lastCleaned?: string | null
  binCount?: number | null
  districtId?: number | null
  signalCount: number
  activeSignalCount: number
  updatedAt: string
  createdAt: string
}

export interface FilterState {
  statuses: string[]
  wasteTypes: string[]
  districtId: string | null
  hasActiveSignals: boolean
}

export const EMPTY_FILTERS: FilterState = {
  statuses: [],
  wasteTypes: [],
  districtId: null,
  hasActiveSignals: false,
}

export function applyFilters(containers: MarkerPoint[], filters: FilterState): MarkerPoint[] {
  return containers.filter((c) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(c.status)) return false
    if (filters.wasteTypes.length > 0 && !filters.wasteTypes.includes(c.wasteType)) return false
    if (filters.districtId !== null && c.districtId !== Number(filters.districtId)) return false
    if (filters.hasActiveSignals && c.activeSignalCount === 0) return false
    return true
  })
}

export function getMarkerColor(c: ContainerWithSignals): string {
  if (c.status === 'inactive' || c.status === 'pending') return '#9CA3AF'
  if (c.status === 'full' || c.status === 'maintenance') return '#EF4444'
  if (c.activeSignalCount > 0) return '#F97316'
  return '#22C55E'
}

export interface Bounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface MarkerPoint extends ContainerWithSignals {
  type: 'marker'
}

export interface ClusterPoint {
  type: 'cluster'
  lat: number
  lng: number
  count: number
  dominantStatus: string
  activeSignalCount: number
}

export type MapItem = ClusterPoint | MarkerPoint
