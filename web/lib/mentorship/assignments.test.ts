import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assignedMenteeUserIds,
  assignedMentorUserIds,
  filterAssignmentsForMentee,
  isActiveAssignment,
  mentorCanViewMentee,
  recordMenteeUserId,
  recordMentorUserId,
} from './assignment-model.ts'

test('recordMentorUserId and recordMenteeUserId read camelCase and PascalCase', () => {
  assert.equal(recordMentorUserId({ mentorUserId: 'm1' }), 'm1')
  assert.equal(recordMentorUserId({ MentorUserId: 'm2' }), 'm2')
  assert.equal(recordMenteeUserId({ menteeUserId: 'e1' }), 'e1')
  assert.equal(recordMenteeUserId({ MenteeUserId: 'e2' }), 'e2')
})

test('isActiveAssignment treats missing status as active', () => {
  assert.equal(isActiveAssignment({}), true)
  assert.equal(isActiveAssignment({ status: 'active' }), true)
  assert.equal(isActiveAssignment({ status: 'ended' }), false)
})

test('assignedMenteeUserIds deduplicates mentee ids', () => {
  assert.deepEqual(
    assignedMenteeUserIds([
      { menteeUserId: 'a' },
      { menteeUserId: 'b' },
      { MenteeUserId: 'a' },
    ]),
    ['a', 'b']
  )
})

test('mentorCanViewMentee requires active assignment between the two users', () => {
  const assignments = [
    { mentorUserId: 'm1', menteeUserId: 'e1', status: 'active' },
    { mentorUserId: 'm1', menteeUserId: 'e2', status: 'ended' },
  ]
  assert.equal(mentorCanViewMentee(assignments, 'm1', 'e1'), true)
  assert.equal(mentorCanViewMentee(assignments, 'm1', 'e2'), false)
  assert.equal(mentorCanViewMentee(assignments, 'm2', 'e1'), false)
})

test('filterAssignmentsForMentee keeps only active rows for that mentee', () => {
  const assignments = [
    { mentorUserId: 'm1', menteeUserId: 'e1', status: 'active' },
    { mentorUserId: 'm2', menteeUserId: 'e1' },
    { mentorUserId: 'm3', menteeUserId: 'e1', status: 'ended' },
    { mentorUserId: 'm4', menteeUserId: 'e1', status: 'paused' },
    { mentorUserId: 'm1', menteeUserId: 'e2', status: 'active' },
  ]
  const result = filterAssignmentsForMentee(assignments, 'e1')
  assert.deepEqual(
    result.map((record) => record.mentorUserId),
    ['m1', 'm2']
  )
})

test('filterAssignmentsForMentee excludes a row where the mentee is also the mentor', () => {
  const assignments = [
    { mentorUserId: 'u1', menteeUserId: 'u1', status: 'active' },
    { mentorUserId: 'm1', menteeUserId: 'u1', status: 'active' },
  ]
  const result = filterAssignmentsForMentee(assignments, 'u1')
  assert.deepEqual(
    result.map((record) => record.mentorUserId),
    ['m1']
  )
})

test('assignedMentorUserIds deduplicates mentor ids', () => {
  assert.deepEqual(
    assignedMentorUserIds([
      { mentorUserId: 'a' },
      { mentorUserId: 'b' },
      { MentorUserId: 'a' },
    ]),
    ['a', 'b']
  )
})

test('filterAssignmentsForMentee returns an empty list for a mentee with no rows at all', () => {
  // covers: AC-2
  assert.deepEqual(filterAssignmentsForMentee([], 'e1'), [])
  assert.deepEqual(
    filterAssignmentsForMentee([{ mentorUserId: 'm1', menteeUserId: 'other' }], 'e1'),
    []
  )
})

test('assignedMentorUserIds returns an empty list when there are no assignments', () => {
  // covers: AC-2
  assert.deepEqual(assignedMentorUserIds([]), [])
})
