import assert from 'node:assert/strict'
import test from 'node:test'
import { createBlocksClient } from '@seliseblocks/client'

try {
  process.loadEnvFile?.('.env.local')
} catch {
  // CI has no local env file
}

import { blocksConfig } from './config.ts'
import {
  resetServiceBlocksClientForTest,
  getServiceBlocksClient,
} from './service-client.ts'
import {
  notifyRole,
  notifyUser,
  sendNotification,
  type NotificationPayload,
} from './notifications.ts'

// Live round trip test (AC-7): sends through the real service credential and reads the
// result back from the recipient's own inbox, not just the send response. Requires
// BLOCKS_SERVICE_CLIENT_ID/SECRET (web/.env.local) and the seeded admin account from AGENTS.md.
// The mentee/mentor seed accounts are not yet activated in this tenant (login rejects them),
// so both the user-targeted and role-targeted checks verify against the one active seed
// account, noor@yopmail.com (role: admin).
const SEED_EMAIL = 'noor@yopmail.com'
const SEED_PASSWORD = 'Pass@123'
const SEED_ROLE = 'admin'
const hasServiceCreds = Boolean(
  process.env.BLOCKS_SERVICE_CLIENT_ID &&
  process.env.BLOCKS_SERVICE_CLIENT_SECRET,
)

const findUserIdByEmail = async (email: string): Promise<string> => {
  const response = await getServiceBlocksClient().iam.users.list({
    pageSize: 200,
  })
  const user = response.data?.find((candidate) => candidate.email === email)
  assert.ok(user?.itemId, `seeded user not found: ${email}`)
  return user.itemId as string
}

const readOwnInbox = async (email: string, password: string) => {
  const bareClient = createBlocksClient({
    apiUrl: blocksConfig.apiUrl,
    xBlocksKey: blocksConfig.xBlocksKey,
  })
  const login = await bareClient.auth.login({ username: email, password })
  const accessToken = login.access_token ?? login.accessToken
  assert.ok(accessToken, `login failed for ${email}: ${JSON.stringify(login)}`)

  const authedClient = createBlocksClient({
    apiUrl: blocksConfig.apiUrl,
    xBlocksKey: blocksConfig.xBlocksKey,
    accessToken,
  })
  const inbox = await authedClient.notifier.getNotifications({ pageSize: 50 })
  return inbox.notifications ?? []
}

const inboxContains = (
  notifications: Record<string, unknown>[],
  marker: string,
): boolean =>
  notifications.some((item) => JSON.stringify(item).includes(marker))

test(
  "notifyUser delivers to the target user's own inbox (AC-1, AC-7)",
  { skip: !hasServiceCreds },
  async () => {
    const marker = `notify-user-test-${Date.now()}`
    const userId = await findUserIdByEmail(SEED_EMAIL)
    const payload: NotificationPayload = {
      title: 'Test notification',
      body: marker,
      category: 'test_notify_user',
    }

    const response = await sendNotification({ userIds: [userId], payload })
    assert.ok(
      response.isSuccess,
      `notify() did not report success: ${JSON.stringify(response)}`,
    )

    const notifications = await readOwnInbox(SEED_EMAIL, SEED_PASSWORD)
    assert.ok(
      inboxContains(notifications, marker),
      'notification was not found in the recipient inbox',
    )
  },
)

test(
  'notifyRole delivers to every member of the role (AC-2, AC-7)',
  { skip: !hasServiceCreds },
  async () => {
    const marker = `notify-role-test-${Date.now()}`
    const payload: NotificationPayload = {
      title: 'Test role notification',
      body: marker,
      category: 'test_notify_role',
    }

    const response = await sendNotification({ roles: [SEED_ROLE], payload })
    assert.ok(
      response.isSuccess,
      `notify() did not report success: ${JSON.stringify(response)}`,
    )

    const notifications = await readOwnInbox(SEED_EMAIL, SEED_PASSWORD)
    assert.ok(
      inboxContains(notifications, marker),
      'role notification was not found in the admin inbox',
    )
  },
)

test(
  'notifyRole with no current members completes without throwing (AC-5)',
  { skip: !hasServiceCreds },
  async () => {
    await assert.doesNotReject(() =>
      notifyRole('role-slug-with-no-members', {
        title: 'No members',
        body: 'no-op',
        category: 'test_no_members',
      }),
    )
  },
)

test(
  'notifyUser with no matching account completes without throwing (AC-5)',
  { skip: !hasServiceCreds },
  async () => {
    await assert.doesNotReject(() =>
      notifyUser('00000000-0000-0000-0000-000000000000', {
        title: 'No matching user',
        body: 'no-op',
        category: 'test_no_matching_user',
      }),
    )
  },
)

test(
  'notifyUser swallows a notifier failure and never throws (AC-4)',
  { skip: !hasServiceCreds },
  async () => {
    resetServiceBlocksClientForTest()
    const originalFetch = globalThis.fetch
    globalThis.fetch = (() =>
      Promise.reject(new Error('simulated network failure'))) as typeof fetch
    try {
      await assert.doesNotReject(() =>
        notifyUser('does-not-matter', {
          title: 'x',
          body: 'x',
          category: 'test_failure',
        }),
      )
    } finally {
      globalThis.fetch = originalFetch
      resetServiceBlocksClientForTest()
    }
  },
)
