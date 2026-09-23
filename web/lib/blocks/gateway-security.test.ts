import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const rules = JSON.parse(
  readFileSync(new URL('../../../blocks/data/rules.json', import.meta.url), 'utf8')
) as { policies: { policyName: string; schemaName: string; operation: number }[] }

const permissions = JSON.parse(
  readFileSync(new URL('../../../blocks/iam/permissions.json', import.meta.url), 'utf8')
) as {
  roleAssignments: Record<string, string[]>
}

const validations = JSON.parse(
  readFileSync(new URL('../../../blocks/data/validations.json', import.meta.url), 'utf8')
) as {
  schemaIds: Record<string, string>
  fields: { schemaName: string; fieldName: string; validations: { type: number }[] }[]
}

const policyNames = rules.policies.map((policy) => policy.policyName)

const schemasWithCustomSecurity = [
  'c740f6c2-e4e0-4156-bc55-0b0f35d12bc1',
  '42d5e3a9-02ef-4c45-a4c9-e13c5c8e076f',
  'bae7beaa-255b-49f3-8a38-a2b2929a8ad3',
  'dc2686f7-2c11-43bb-bd0e-3c780a6c4071',
]

describe('data gateway security rules', () => {
  it('uses Custom access on all four schemas for every operation', () => {
    const security = JSON.parse(
      readFileSync(new URL('../../../blocks/data/rules.json', import.meta.url), 'utf8')
    ).security as { schemaId: string; accessLevel: number }[]
    for (const schemaId of schemasWithCustomSecurity) {
      const rows = security.filter((row) => row.schemaId === schemaId)
      assert.equal(rows.length, 4)
      assert.ok(rows.every((row) => row.accessLevel === 3))
    }
  })

  it('keeps one combined read policy per schema that needs OR branches', () => {
    assert.equal(
      policyNames.filter((name) => name === 'mentee-profile-read-own').length,
      1
    )
    assert.equal(
      policyNames.filter((name) => name === 'assignment-read-as-mentor').length,
      1
    )
    assert.doesNotMatch(JSON.stringify(policyNames), /mentee-profile-read-by-mentor/)
    assert.doesNotMatch(JSON.stringify(policyNames), /assignment-read-as-mentee/)
  })

  it('allows admin mentor create but not admin mentor edit', () => {
    assert.ok(policyNames.includes('mentor-profile-create-admin'))
    assert.ok(!policyNames.includes('mentor-profile-edit-admin'))
  })

  it('authors explicit Write and Edit policies for profile schemas', () => {
    const mentorWrites = rules.policies.filter(
      (policy) => policy.schemaName === 'MentorProfile' && policy.operation === 1
    )
    const mentorEdits = rules.policies.filter(
      (policy) => policy.schemaName === 'MentorProfile' && policy.operation === 2
    )
    assert.ok(mentorWrites.length >= 2)
    assert.ok(mentorEdits.length >= 1)
  })
})

describe('data gateway validation manifest', () => {
  it('maps schema names to the live gateway ids', () => {
    assert.equal(validations.schemaIds.MentorProfile, schemasWithCustomSecurity[0])
    assert.equal(validations.schemaIds.MenteeProfile, schemasWithCustomSecurity[1])
    assert.equal(validations.schemaIds.MentorshipAssignment, schemasWithCustomSecurity[2])
    assert.equal(validations.schemaIds.UserPreference, schemasWithCustomSecurity[3])
  })

  it('lists eleven validated fields across four schemas', () => {
    assert.equal(validations.fields.length, 11)
    const schemaNames = new Set(validations.fields.map((field) => field.schemaName))
    assert.deepEqual([...schemaNames].sort(), [
      'MenteeProfile',
      'MentorProfile',
      'MentorshipAssignment',
      'UserPreference',
    ])
  })

  it('mirrors client required mentor fields and mentee goals or interests', () => {
    const mentorDisplay = validations.fields.find(
      (field) => field.schemaName === 'MentorProfile' && field.fieldName === 'displayName'
    )
    const mentorTitle = validations.fields.find(
      (field) => field.schemaName === 'MentorProfile' && field.fieldName === 'title'
    )
    const menteeGoals = validations.fields.find(
      (field) => field.schemaName === 'MenteeProfile' && field.fieldName === 'goals'
    )
    assert.ok(mentorDisplay?.validations.some((rule) => rule.type === 0))
    assert.ok(mentorTitle?.validations.some((rule) => rule.type === 0))
    assert.ok(menteeGoals?.validations.some((rule) => rule.type === 0))
  })
})

describe('IAM alignment with gateway roles', () => {
  it('grants mentors and mentees own profile write permissions for the app shell', () => {
    assert.ok(
      permissions.roleAssignments.mentor.includes('mentormatch::profiles::write-own-mentor')
    )
    assert.ok(
      permissions.roleAssignments.mentee.includes('mentormatch::profiles::write-own-mentee')
    )
  })

  it('grants admin view all profiles for People without blocks-data config scopes', () => {
    const adminScopes = permissions.roleAssignments.admin
    assert.ok(adminScopes.includes('mentormatch::admin::view-all-profiles'))
    assert.ok(!adminScopes.some((scope) => scope.startsWith('blocks-data::data-access::')))
  })
})
