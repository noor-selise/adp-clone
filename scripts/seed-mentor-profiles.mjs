import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
const { blocksRequest } = await import(
  pathToFileURL(`${globalRoot}/@seliseblocks/cli-os/dist/lib/api.js`).href
)

const PROJECT_ID = 'D67e7edaf9e1d432288361305fcc74c47'

const SEED_MENTORS = [
  {
    userId: '723f39a7-df1f-4771-a2d2-05eb4ad50902',
    displayName: 'Adnan Bhai',
    title: 'Senior Product Designer',
  },
  {
    userId: 'ba8f9f42-ce1a-4e88-8bc8-8f72c9766221',
    displayName: 'Sajib Bhai',
    title: 'Engineering Manager',
  },
  {
    userId: 'c71a999b-7282-4aa5-b2dd-fb175ab772fc',
    displayName: 'Uday Bhai',
    title: 'Staff Engineer',
  },
]

const listMentorProfiles = async () => {
  const response = await blocksRequest('/data/v4/gateway', {
    method: 'POST',
    impersonatedProjectAuth: true,
    projectTenantId: PROJECT_ID,
    body: {
      operationName: 'getMentorProfiles',
      query: `query getMentorProfiles($input: DynamicQueryInput) {
        getMentorProfiles(input: $input) {
          items { ItemId userId displayName title }
          totalCount
        }
      }`,
      variables: { input: { pageNo: 1, pageSize: 100 } },
    },
  })

  return (
    response?.data?.getMentorProfiles?.items ??
    response?.getMentorProfiles?.items ??
    []
  )
}

const insertMentorProfile = async (profile) => {
  return blocksRequest('/data/v4/gateway', {
    method: 'POST',
    impersonatedProjectAuth: true,
    projectTenantId: PROJECT_ID,
    body: {
      operationName: 'insertMentorProfile',
      query: `mutation insertMentorProfile($input: MentorProfileInsertInput!) {
        insertMentorProfile(input: $input) {
          acknowledged
          itemId
          message
        }
      }`,
      variables: {
        input: {
          userId: profile.userId,
          displayName: profile.displayName,
          title: profile.title,
          timezone: 'Asia/Dhaka',
          companyVerificationStatus: 'unverified',
        },
      },
    },
  })
}

const main = async () => {
  const existing = await listMentorProfiles()
  const existingUserIds = new Set(existing.map((item) => item.userId ?? item.UserId))

  for (const mentor of SEED_MENTORS) {
    if (existingUserIds.has(mentor.userId)) {
      console.log(`skip ${mentor.displayName}: profile already exists`)
      continue
    }

    const result = await insertMentorProfile(mentor)
    const itemId =
      result?.data?.insertMentorProfile?.itemId ??
      result?.insertMentorProfile?.itemId

    console.log(`created ${mentor.displayName}: ${itemId ?? 'ok'}`)
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
