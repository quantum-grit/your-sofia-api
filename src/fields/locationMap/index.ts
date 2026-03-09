import type { UIField } from 'payload'

export const locationMapField: UIField = {
  name: 'locationMap',
  type: 'ui',
  admin: {
    components: {
      Field: '@/fields/locationMap/LocationMapComponent#LocationMapComponent',
    },
  },
}
