import type { CollectionAfterChangeHook } from 'payload'
import { sendPushNotificationsToTokens } from '@/utilities/pushNotifications'

const notifyStatuses = ['in-progress', 'resolved', 'rejected'] as const
type NotifyStatus = (typeof notifyStatuses)[number]

const notifContent: Record<NotifyStatus, { title: string; body: string }> = {
  'in-progress': {
    title: 'Сигналът ви е в изпълнение',
    body: `Сигналът е взет за изпълнение от отговорния район.`,
  },
  resolved: {
    title: 'Сигналът ви е приключен',
    body: `Сигналът е приключен. Благодарим за вашия принос!`,
  },
  rejected: {
    title: 'Сигналът ви е отхвърлен',
    body: `Сигналът не може да бъде изпълнен в момента.`,
  },
}

export const afterChangeNotifyReporter: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  // Notify citizen on any meaningful status transition: in-progress, resolved, rejected
  if (operation === 'create') return doc

  const statusChanged = previousDoc?.status !== doc.status
  const shouldNotify = notifyStatuses.includes(doc.status as NotifyStatus)

  if (statusChanged && shouldNotify && doc.reporterUniqueId) {
    const content = notifContent[doc.status as NotifyStatus]

    try {
      const tokenResult = await req.payload.find({
        collection: 'push-tokens',
        where: {
          and: [
            { reporterUniqueId: { equals: doc.reporterUniqueId } },
            { active: { equals: true } },
          ],
        },
        limit: 10,
        overrideAccess: true,
      })

      const tokenStrings = tokenResult.docs.map((t) => t.token as string).filter(Boolean)

      if (tokenStrings.length === 0) {
        req.payload.logger.info(
          `[Signals] No active push token for reporterUniqueId ${doc.reporterUniqueId} — skipping notification`
        )
      } else {
        await sendPushNotificationsToTokens(req.payload, tokenStrings, {
          title: content.title,
          body: content.body,
          data: {
            type: 'signal-status-update',
            signalId: String(doc.id),
            status: doc.status,
          },
        })
        req.payload.logger.info(
          `[Signals] Sent signal-status-update (${doc.status}) notification for signal ${doc.id} to ${tokenStrings.length} token(s)`
        )
      }
    } catch (err) {
      req.payload.logger.error(
        `[Signals] Failed to send signal-status-update notification for signal ${doc.id}: ${err}`
      )
    }
  }

  return doc
}
