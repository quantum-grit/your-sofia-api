import type { CollectionAfterReadHook } from 'payload'

export const afterReadStripReporterUniqueId: CollectionAfterReadHook = ({ doc, req }) => {
  // Strip reporterUniqueId from responses for non-admin users.
  // Non-admins can still filter by it (they know their own ID),
  // but cannot read it out of other documents — preventing IDOR leakage.
  if (req.user?.role !== 'admin') {
    doc.reporterUniqueId = undefined
  }
  return doc
}
