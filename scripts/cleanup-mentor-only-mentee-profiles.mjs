import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
const { blocksRequest } = await import(
  pathToFileURL(`${globalRoot}/@seliseblocks/cli-os/dist/lib/api.js`).href
)

const PROJECT_ID = 'D67e7edaf9e1d432288361305fcc74c47'

/** Seed mentors are mentor-role only; remove stray mentee profiles created during testing. */
const MENTOR_ONLY_USER_IDS = [
  '723f39a7-df1f-4771-a2d2-05eb4ad50902',
  'ba8f9f42-ce1a-4e88-8bc8-8f72c9766221',
  'c71a999b-7282-4aa5-b2dd-fb175ab772fc',
]

const listMenteeProfiles = async () => {
  const response = await blocksRequest('/data/v4/gateway', {
    method: 'POST',
    impersonatedProjectAuth: true,
    projectTenantId: PROJECT_ID,
    body: {
      operationName: 'getMenteeProfiles',
      query: `query getMenteeProfiles($input: DynamicQueryInput) {
        getMenteeProfiles(input: $input) {
          items { ItemId userId goals interests }
          totalCount
        }
      }`,
      variables: { input: { pageNo: 1, pageSize: 100 } },
    },
  })

  return (
    response?.data?.getMenteeProfiles?.items ??
    response?.getMenteeProfiles?.items ??
    []
  )
}

const deleteMenteeProfile = async (itemId) => {
  return blocksRequest('/data/v4/gateway', {
    method: 'POST',
    impersonatedProjectAuth: true,
    projectTenantId: PROJECT_ID,
    body: {
      operationName: 'deleteMenteeProfile',
      query: `mutation deleteMenteeProfile($filter: String, $input: MenteeProfileDeleteInput!) {
        deleteMenteeProfile(filter: $filter, input: $input) {
          acknowledged
          itemId
          message
        }
      }`,
      variables: {
        filter: itemId,
        input: {},
      },
    },
  })
}

const main = async () => {
  const mentorOnly = new Set(MENTOR_ONLY_USER_IDS)
  const mentees = await listMenteeProfiles()

  for (const profile of mentees) {
    const userId = profile.userId ?? profile.UserId
    const itemId = profile.ItemId ?? profile.itemId
    if (!userId || !itemId || !mentorOnly.has(userId)) continue

    const result = await deleteMenteeProfile(itemId)
    const deletedId =
      result?.data?.deleteMenteeProfile?.itemId ?? result?.deleteMenteeProfile?.itemId ?? itemId
    console.log(`deleted mentee profile ${deletedId} for user ${userId}`)
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
