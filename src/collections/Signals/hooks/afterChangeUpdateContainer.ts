import type { CollectionAfterChangeHook } from 'payload'
import type { WasteContainer } from '@/payload-types'

export const afterChangeUpdateContainer: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Only run on create operation
  if (operation !== 'create') return doc

  // Check if this is a waste container signal
  if (
    doc.category === 'waste-container' &&
    doc.cityObject?.type === 'waste-container' &&
    doc.cityObject?.referenceId
  ) {
    try {
      // Find the container by publicNumber
      const containers = await req.payload.find({
        collection: 'waste-containers',
        where: {
          publicNumber: {
            equals: doc.cityObject.referenceId,
          },
        },
        limit: 1,
      })

      if (containers.docs.length > 0 && containers.docs[0]) {
        const container = containers.docs[0]
        const updateData: Partial<Pick<WasteContainer, 'status' | 'state'>> = {}

        // Update container status to "full" if signal reports it as full
        if (Array.isArray(doc.containerState) && doc.containerState.length > 0) {
          if (container.status !== 'full') {
            updateData.status = 'full'
          }
        }

        // Update container state field with new states from signal
        if (Array.isArray(doc.containerState) && doc.containerState.length > 0) {
          // Get existing states or empty array
          const existingStates = Array.isArray(container.state) ? container.state : []

          // Merge states (add new ones, remove duplicates)
          const mergedStates = [...new Set([...existingStates, ...doc.containerState])]

          updateData.state = mergedStates as WasteContainer['state']
        }

        // Only update if there's something to update
        if (Object.keys(updateData).length > 0) {
          await req.payload.update({
            collection: 'waste-containers',
            id: container.id,
            data: updateData,
          })

          req.payload.logger.info(
            `Container ${doc.cityObject.referenceId} updated due to signal ${doc.id}. Changes: ${JSON.stringify(updateData)}`
          )
        }
      }
    } catch (error) {
      req.payload.logger.error(`Failed to update container for signal ${doc.id}: ${error}`)
    }
  }

  return doc
}
