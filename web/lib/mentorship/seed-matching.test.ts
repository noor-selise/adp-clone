import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSkillMatchedAssignments, scoreMentorMenteeMatch } from '../../../scripts/seed-matching.mjs'

test('scoreMentorMenteeMatch rewards direct tag overlap', () => {
  assert.ok(
    scoreMentorMenteeMatch(['figma', 'design'], ['figma', 'ui']) >
      scoreMentorMenteeMatch(['kubernetes', 'devops'], ['figma', 'ui'])
  )
})

test('buildSkillMatchedAssignments links design mentees to design mentors', () => {
  const mentors = [
    {
      email: 'mentor1@yopmail.com',
      domains: ['design'],
      matchTags: ['figma', 'design', 'ux'],
    },
    {
      email: 'mentor5@yopmail.com',
      domains: ['platform'],
      matchTags: ['kubernetes', 'aws'],
    },
  ]
  const mentees = [
    {
      email: 'mentee1@yopmail.com',
      domains: ['design'],
      matchTags: ['figma', 'ui', 'design'],
    },
  ]

  const assignments = buildSkillMatchedAssignments(mentors, mentees, 5)
  assert.equal(assignments.length, 1)
  assert.equal(assignments[0]?.mentorEmail, 'mentor1@yopmail.com')
})
