import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Automatically sets the `reporter` relationship to the authenticated user
 * when a signal is first created.
 */
export const beforeChangeSetReporter: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' && req.user) {
    return {
      ...data,
      reporter: req.user.id,
    }
  }
  return data
}
