import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assignedMenteeUserIds,
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
