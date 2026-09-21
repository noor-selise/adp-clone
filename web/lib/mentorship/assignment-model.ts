export type MentorshipAssignmentRecord = {
  itemId?: string
  ItemId?: string
  mentorUserId?: string
  MentorUserId?: string
  menteeUserId?: string
  MenteeUserId?: string
  status?: string
}

export const recordMentorUserId = (
  record: MentorshipAssignmentRecord | undefined
): string | undefined => record?.mentorUserId ?? record?.MentorUserId

export const recordMenteeUserId = (
  record: MentorshipAssignmentRecord | undefined
): string | undefined => record?.menteeUserId ?? record?.MenteeUserId

export const isActiveAssignment = (record: MentorshipAssignmentRecord): boolean => {
  const status = record.status?.toLowerCase()
  return !status || status === 'active'
}

export const filterAssignmentsForMentor = (
  items: MentorshipAssignmentRecord[],
  mentorUserId: string
): MentorshipAssignmentRecord[] =>
  items.filter(
    (record) => recordMentorUserId(record) === mentorUserId && isActiveAssignment(record)
  )

export const filterAssignmentsForMentee = (
  items: MentorshipAssignmentRecord[],
  menteeUserId: string
): MentorshipAssignmentRecord[] =>
  items.filter(
    (record) =>
      recordMenteeUserId(record) === menteeUserId &&
      recordMentorUserId(record) !== menteeUserId &&
      isActiveAssignment(record)
  )

export const assignedMenteeUserIds = (assignments: MentorshipAssignmentRecord[]): string[] => {
  const ids = assignments
    .map((record) => recordMenteeUserId(record))
    .filter((id): id is string => Boolean(id))
  return [...new Set(ids)]
}

export const assignedMentorUserIds = (assignments: MentorshipAssignmentRecord[]): string[] => {
  const ids = assignments
    .map((record) => recordMentorUserId(record))
    .filter((id): id is string => Boolean(id))
  return [...new Set(ids)]
}

export const mentorCanViewMentee = (
  assignments: MentorshipAssignmentRecord[],
  mentorUserId: string,
  menteeUserId: string
): boolean =>
  assignments.some(
    (record) =>
      isActiveAssignment(record) &&
      recordMentorUserId(record) === mentorUserId &&
      recordMenteeUserId(record) === menteeUserId
  )
