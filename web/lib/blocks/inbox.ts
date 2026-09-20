import { getBlocksClient } from './client'

export type InboxNotification = {
  id: string
  title: string
  body: string
  category: string
  link?: string
  isRead: boolean
  createdTime: string
}

export type InboxState = {
  notifications: InboxNotification[]
  unreadCount: number
}

const PAGE_SIZE = 10

type RawNotification = Record<string, unknown>

const safeParse = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const readPayload = (raw: RawNotification) => {
  const payload = raw.denormalizedPayload
  const parsed = typeof payload === 'string' ? safeParse(payload) : payload
  const record = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>
  return {
    title: typeof record.title === 'string' ? record.title : '',
    body: typeof record.body === 'string' ? record.body : '',
    category: typeof record.category === 'string' ? record.category : '',
    link: typeof record.link === 'string' ? record.link : undefined,
  }
}

const normalizeNotification = (raw: RawNotification): InboxNotification => {
  const payload = readPayload(raw)
  return {
    id: String(raw.id ?? ''),
    ...payload,
    isRead: raw.isRead === true,
    createdTime: typeof raw.createdTime === 'string' ? raw.createdTime : new Date(0).toISOString(),
  }
}

// This app's own inbox is always read scoped by the signed in user's own OIDC access token
// (getBlocksClient(), never the service credential from web/lib/blocks/notifications.ts), so
// there is no user id to pass or trust here (spec 0006 AC-11).
export const fetchInbox = async (): Promise<InboxState> => {
  const response = await getBlocksClient().notifier.getNotifications({ pageSize: PAGE_SIZE })
  return {
    notifications: (response.notifications ?? []).map(normalizeNotification),
    unreadCount: response.unReadNotificationsCount ?? 0,
  }
}

// Always refetches after the mutation resolves so the caller never guesses the new
// count/list locally (spec 0006 AC-4's "no locally guessed count" invariant).
export const markRead = async (id: string): Promise<InboxState> => {
  await getBlocksClient().notifier.markNotificationAsRead({ id })
  return fetchInbox()
}

export const markAllRead = async (): Promise<InboxState> => {
  await getBlocksClient().notifier.markAllNotificationAsRead()
  return fetchInbox()
}
