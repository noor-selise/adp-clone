import { getBlocksClient } from '@/lib/blocks/client'
import { parseCollectionList } from '@/lib/profiles/collection'
import { fetchMenteeProfile, type MenteeProfileRecord } from '@/lib/profiles'
import {
  assignedMenteeUserIds,
  filterAssignmentsForMentor,
  mentorCanViewMentee,
  type MentorshipAssignmentRecord,
} from '@/lib/mentorship/assignment-model'

export type { MentorshipAssignmentRecord } from '@/lib/mentorship/assignment-model'
export {
  assignedMenteeUserIds,
  isActiveAssignment,
  mentorCanViewMentee,
  recordMenteeUserId,
  recordMentorUserId,
} from '@/lib/mentorship/assignment-model'

const ASSIGNMENT_SCHEMA = 'MentorshipAssignment'
const ASSIGNMENT_LIST_FIELD = 'getMentorshipAssignments'

const assignmentCollection = () =>
  getBlocksClient().data.collection<{
    mentorUserId: string
    menteeUserId: string
    status: string
  }>(ASSIGNMENT_SCHEMA)

/** ponytail: client-side filter until owner-scoped data rules are deployed */
export const listAssignmentsForMentor = async (
  mentorUserId: string
): Promise<MentorshipAssignmentRecord[]> => {
  const items = parseCollectionList<MentorshipAssignmentRecord>(
    await assignmentCollection().list({
      pageNo: 1,
      pageSize: 200,
      fields: ['mentorUserId', 'menteeUserId', 'status'],
    }),
    ASSIGNMENT_LIST_FIELD
  )

  return filterAssignmentsForMentor(items, mentorUserId)
}

export const fetchAssignedMenteeProfiles = async (
  mentorUserId: string
): Promise<MenteeProfileRecord[]> => {
  const assignments = await listAssignmentsForMentor(mentorUserId)
  const menteeUserIds = assignedMenteeUserIds(assignments)
  const profiles = await Promise.all(menteeUserIds.map((userId) => fetchMenteeProfile(userId)))
  return profiles.filter((profile): profile is MenteeProfileRecord => Boolean(profile))
}

export const canMentorViewMenteeProfile = async (
  mentorUserId: string,
  menteeUserId: string
): Promise<boolean> => {
  const items = parseCollectionList<MentorshipAssignmentRecord>(
    await assignmentCollection().list({
      pageNo: 1,
      pageSize: 200,
      fields: ['mentorUserId', 'menteeUserId', 'status'],
    }),
    ASSIGNMENT_LIST_FIELD
  )
  return mentorCanViewMentee(items, mentorUserId, menteeUserId)
}
