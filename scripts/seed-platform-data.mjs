import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildSkillMatchedAssignments } from './seed-matching.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(__dirname, 'seed-manifest.json'), 'utf8'))

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
const { blocksRequest } = await import(
  pathToFileURL(`${globalRoot}/@seliseblocks/cli-os/dist/lib/api.js`).href
)

const PROJECT_ID = 'D67e7edaf9e1d432288361305fcc74c47'
const TIMEZONE = 'Asia/Dhaka'

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

const ensureUser = (usersByEmail, person, role) => {
  const existing = usersByEmail[person.email]
  if (existing) {
    console.log(`skip user ${person.email}: already exists`)
    return existing
  }

  const response = JSON.parse(
    execSync(
      [
        'blocks iam users create',
        `--email ${person.email}`,
        `--password ${manifest.password}`,
        `--first-name "${person.firstName}"`,
        `--last-name "${person.lastName}"`,
        `--roles ${role}`,
        '--yes --json',
      ].join(' '),
      { encoding: 'utf8' }
    )
  )
  const itemId = response.data?.itemId ?? response.itemId
  console.log(`created user ${person.email}: ${itemId}`)
  return itemId
}

const listRecords = async (queryName, fields) => {
  const response = await gateway(
    queryName,
    `query ${queryName}($input: DynamicQueryInput) {
      ${queryName}(input: $input) {
        items { ItemId ${fields.join(' ')} }
        totalCount
      }
    }`,
    { input: { pageNo: 1, pageSize: 200 } }
  )
  return response?.data?.[queryName]?.items ?? response?.[queryName]?.items ?? []
}

const insertRecord = async (mutationName, schemaName, input) =>
  gateway(
    mutationName,
    `mutation ${mutationName}($input: ${schemaName}InsertInput!) {
      ${mutationName}(input: $input) {
        acknowledged
        itemId
        message
      }
    }`,
    { input }
  )

const updateRecord = async (mutationName, schemaName, itemId, input) =>
  gateway(
    mutationName,
    `mutation ${mutationName}($filter: String, $input: ${schemaName}UpdateInput!) {
      ${mutationName}(filter: $filter, input: $input) {
        acknowledged
        itemId
        message
      }
    }`,
    { filter: updateFilter(itemId), input }
  )

const deleteRecord = async (mutationName, schemaName, itemId) =>
  gateway(
    mutationName,
    `mutation ${mutationName}($filter: String, $input: ${schemaName}DeleteInput!) {
      ${mutationName}(filter: $filter, input: $input) {
        acknowledged
        itemId
        message
      }
    }`,
    { filter: updateFilter(itemId), input: { isHardDelete: true } }
  )

const recordId = (record) => record?.ItemId ?? record?.itemId
const recordUserId = (record) => record?.userId ?? record?.UserId
const updateFilter = (itemId) => JSON.stringify({ ItemId: itemId })

const upsertMentorProfile = async (mentor, profilesByUserId) => {
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

  const existing = profilesByUserId.get(mentor.userId)
  if (existing) {
    await updateRecord('updateMentorProfile', 'MentorProfile', recordId(existing), payload)
    console.log(`updated mentor profile ${mentor.displayName}`)
    return
  }

  await insertRecord('insertMentorProfile', 'MentorProfile', {
    userId: mentor.userId,
    ...payload,
  })
  console.log(`created mentor profile ${mentor.displayName}`)
}

const upsertMenteeProfile = async (mentee, profilesByUserId) => {
  const payload = {
    displayName: mentee.displayName,
    goals: mentee.goals,
    interests: mentee.interests,
    timezone: TIMEZONE,
  }

  const existing = profilesByUserId.get(mentee.userId)
  if (existing) {
    await updateRecord('updateMenteeProfile', 'MenteeProfile', recordId(existing), payload)
    console.log(`updated mentee profile ${mentee.displayName}`)
    return
  }

  await insertRecord('insertMenteeProfile', 'MenteeProfile', {
    userId: mentee.userId,
    ...payload,
  })
  console.log(`created mentee profile ${mentee.displayName}`)
}

const assignmentKey = (mentorUserId, menteeUserId) => `${mentorUserId}:${menteeUserId}`

const main = async () => {
  const users = listUsers()
  const usersByEmail = Object.fromEntries(users.map((user) => [user.email, user.itemId]))

  const mentors = manifest.mentors.map((mentor) => {
    const userId = ensureUser(usersByEmail, mentor, 'mentor')
    usersByEmail[mentor.email] = userId
    return { ...mentor, userId }
  })

  const mentees = manifest.mentees.map((mentee) => {
    const userId = ensureUser(usersByEmail, mentee, 'mentee')
    usersByEmail[mentee.email] = userId
    return { ...mentee, userId }
  })

  const mentorProfiles = await listRecords('getMentorProfiles', [
    'userId',
    'displayName',
    'title',
    'company',
    'bio',
    'skills',
    'languages',
  ])
  const mentorProfilesByUserId = new Map(
    mentorProfiles.map((profile) => [recordUserId(profile), profile])
  )

  for (const mentor of mentors) {
    await upsertMentorProfile(mentor, mentorProfilesByUserId)
  }

  const menteeProfiles = await listRecords('getMenteeProfiles', [
    'userId',
    'displayName',
    'goals',
    'interests',
  ])
  const menteeProfilesByUserId = new Map(
    menteeProfiles.map((profile) => [recordUserId(profile), profile])
  )

  for (const mentee of mentees) {
    await upsertMenteeProfile(mentee, menteeProfilesByUserId)
  }

  const matchedPairs = buildSkillMatchedAssignments(
    mentors,
    mentees,
    manifest.assignmentsPerMentee ?? 5
  )
  const desiredKeys = new Set(
    matchedPairs.map((pair) =>
      assignmentKey(usersByEmail[pair.mentorEmail], usersByEmail[pair.menteeEmail])
    )
  )

  const existingAssignments = await listRecords('getMentorshipAssignments', [
    'mentorUserId',
    'menteeUserId',
    'status',
  ])

  let deleted = 0
  for (const assignment of existingAssignments) {
    const mentorId = assignment.mentorUserId ?? assignment.MentorUserId
    const menteeId = assignment.menteeUserId ?? assignment.MenteeUserId
    const normalizedKey = assignmentKey(mentorId, menteeId)
    if (desiredKeys.has(normalizedKey)) continue
    await deleteRecord('deleteMentorshipAssignment', 'MentorshipAssignment', recordId(assignment))
    deleted += 1
  }

  const existingKeys = new Set(
    existingAssignments.map((assignment) =>
      assignmentKey(
        assignment.mentorUserId ?? assignment.MentorUserId,
        assignment.menteeUserId ?? assignment.MenteeUserId
      )
    )
  )

  let created = 0
  for (const pair of matchedPairs) {
    const mentorUserId = usersByEmail[pair.mentorEmail]
    const menteeUserId = usersByEmail[pair.menteeEmail]
    const key = assignmentKey(mentorUserId, menteeUserId)
    if (existingKeys.has(key)) continue
    await insertRecord('insertMentorshipAssignment', 'MentorshipAssignment', {
      mentorUserId,
      menteeUserId,
      status: 'active',
    })
    existingKeys.add(key)
    created += 1
  }

  const mentorCounts = Object.fromEntries(mentors.map((mentor) => [mentor.displayName, 0]))
  for (const pair of matchedPairs) {
    const mentor = mentors.find((entry) => entry.email === pair.mentorEmail)
    if (mentor) mentorCounts[mentor.displayName] += 1
  }

  console.log(`removed ${deleted} stale assignments`)
  console.log(`created ${created} new assignments`)
  console.log(`active skill-matched assignments: ${matchedPairs.length}`)
  console.log('mentor mentee counts:', mentorCounts)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
