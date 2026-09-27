export const syncWasteCollectionSchedules = {
  slug: 'syncWasteCollectionSchedules',
  label: 'Sync Waste Collection Schedules from inspectorat-so.org',
  disabled: true,
  description: 'Temporarily disabled and not registered in Payload jobs.',
  handler: async () => ({
    output: {
      districtsProcessed: 0,
      filesDownloaded: 0,
      streetsMatched: 0,
      containersUpdated: 0,
      streetsUnmatched: 0,
    },
  }),
}
