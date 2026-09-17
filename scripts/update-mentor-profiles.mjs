import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(__dirname, 'seed-manifest.json'), 'utf8'))

const DEFAULT_EMAILS = [
  'mentor1@yopmail.com',
  'mentor2@yopmail.com',
  'mentor3@yopmail.com',
]

const targetEmails = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_EMAILS

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
const { blocksRequest } = await import(
  pathToFileURL(`${globalRoot}/@seliseblocks/cli-os/dist/lib/api.js`).href
)

const PROJECT_ID = 'D67e7edaf9e1d432288361305fcc74c47'
const TIMEZONE = 'Asia/Dhaka'
const updateFilter = (itemId) => JSON.stringify({ ItemId: itemId })

const gateway = async (operationName, query, variables) =>
  blocksRequest('/data/v4/gateway', {
    method: 'POST',
    impersonatedProjectAuth: true,
    projectTenantId: PROJECT_ID,
    body: { operationName, query, variables },
  })

const listUsers = () => {
  const response = JSON.parse(execSync('blocks iam users list --json', { encoding: 'utf8' }))
  return response.data ?? []
}

const listMentorProfiles = async () => {
  const response = await gateway(
    'getMentorProfiles',
    `query getMentorProfiles($input: DynamicQueryInput) {
      getMentorProfiles(input: $input) {
        items { ItemId userId displayName title company bio skills languages }
        totalCount
      }
    }`,
    { input: { pageNo: 1, pageSize: 200 } }
  )
  return response?.data?.getMentorProfiles?.items ?? []
}

const updateMentorProfile = async (itemId, input) =>
  gateway(
    'updateMentorProfile',
    `mutation updateMentorProfile($filter: String, $input: MentorProfileUpdateInput!) {
      updateMentorProfile(filter: $filter, input: $input) {
        acknowledged
        itemId
        message
      }
    }`,
    { filter: updateFilter(itemId), input }
  )

const insertMentorProfile = async (input) =>
  gateway(
    'insertMentorProfile',
    `mutation insertMentorProfile($input: MentorProfileInsertInput!) {
      insertMentorProfile(input: $input) {
        acknowledged
        itemId
        message
      }
    }`,
    { input }
  )

const main = async () => {
  const usersByEmail = Object.fromEntries(listUsers().map((user) => [user.email, user.itemId]))
  const profilesByUserId = new Map(
    (await listMentorProfiles()).map((profile) => [profile.userId ?? profile.UserId, profile])
  )

  const mentors = manifest.mentors.filter((mentor) => targetEmails.includes(mentor.email))
  if (!mentors.length) {
    console.error('No mentors matched target emails:', targetEmails.join(', '))
    process.exit(1)
  }

  for (const mentor of mentors) {
    const userId = usersByEmail[mentor.email]
    if (!userId) {
      console.error(`skip ${mentor.email}: IAM user not found`)
      continue
    }

    const payload = {
      displayName: mentor.displayName,
      title: mentor.title,
      company: mentor.company,
      bio: mentor.bio,
      skills: mentor.skills,
      languages: mentor.languages,
      timezone: TIMEZONE,
      companyVerificationStatus: 'unverified',
    }

    const existing = profilesByUserId.get(userId)
    if (existing) {
      const itemId = existing.ItemId ?? existing.itemId
      await updateMentorProfile(itemId, payload)
      console.log(`updated ${mentor.email} (${mentor.displayName}) → ${itemId}`)
      continue
    }

    const result = await insertMentorProfile({ userId, ...payload })
    const itemId = result?.data?.insertMentorProfile?.itemId ?? result?.insertMentorProfile?.itemId
    console.log(`created ${mentor.email} (${mentor.displayName}) → ${itemId ?? 'ok'}`)
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
