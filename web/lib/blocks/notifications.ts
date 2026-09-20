import type { BlocksNotifierPassThroughResponse } from '@seliseblocks/client'
import { getServiceBlocksClient } from './service-client.ts'

export type NotificationPayload = {
  title: string
  body: string
  category: string
  link?: string
}

type SendNotificationTarget =
  { userIds: string[]; roles?: never } | { userIds?: never; roles: string[] }

// Confirmed empirically (2026-09-20) against the dev tenant: notify() rejects with a 400
// unless configurationName/connectionId/responseKey/responseValue are all present, even for
// a plain user/role targeted send with no live connection. The notification channel config
// "mentormatch-notifications" (channel 0, type 3, enablePersistence: true) was provisioned to
// satisfy configurationName; connectionId/responseKey/responseValue have no live connection to
// report in a server-triggered send, so they carry a constant placeholder the API accepts.
const NOTIFICATION_CONFIGURATION_NAME = 'mentormatch-notifications'
const NO_LIVE_CONNECTION = 'server'

// Exported for the round trip test only (see notifications.test.ts); notifyUser/notifyRole
// are the module's real public surface and are the only functions other app code should call.
export const sendNotification = async (
  target: SendNotificationTarget & { payload: NotificationPayload },
): Promise<BlocksNotifierPassThroughResponse> => {
  const { payload } = target
  return getServiceBlocksClient().notifier.notify({
    userIds: target.userIds,
    roles: target.roles,
    configurationName: NOTIFICATION_CONFIGURATION_NAME,
    connectionId: NO_LIVE_CONNECTION,
    responseKey: NO_LIVE_CONNECTION,
    responseValue: NO_LIVE_CONNECTION,
    denormalizedPayload: JSON.stringify(payload),
    saveDenormalizedPayloadAsAnObject: true,
    subscriptionFilters: [
      { context: 'mentormatch', actionName: payload.category },
    ],
  })
}

export const notifyUser = async (
  userId: string,
  payload: NotificationPayload,
): Promise<void> => {
  try {
    await sendNotification({ userIds: [userId], payload })
  } catch (error) {
    console.error('[blocks-notifications] notifyUser failed', {
      userId,
      category: payload.category,
      error,
    })
  }
}

export const notifyRole = async (
  role: string,
  payload: NotificationPayload,
): Promise<void> => {
  try {
    await sendNotification({ roles: [role], payload })
  } catch (error) {
    console.error('[blocks-notifications] notifyRole failed', {
      role,
      category: payload.category,
      error,
    })
  }
}
