export type ProfileValidationResult =
  | { ok: true }
  | { ok: false; message: string }

export const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const defaultTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone

export const validateMentorProfile = (input: {
  displayName?: string
  title?: string
}): ProfileValidationResult => {
  if (!input.displayName?.trim()) {
    return { ok: false, message: 'Display name is required.' }
  }
  if (!input.title?.trim()) {
    return { ok: false, message: 'Title is required.' }
  }
  return { ok: true }
}

export type MentorProfileCompleteness = {
  percent: number
  missing: string[]
}

export const mentorProfileCompleteness = (input: {
  displayName?: string
  photoFileId?: string
  title?: string
  company?: string
  bio?: string
  skills?: string[]
}): MentorProfileCompleteness => {
  const checks = [
    { label: 'Photo', ok: Boolean(input.photoFileId) },
    { label: 'Display name', ok: Boolean(input.displayName?.trim()) },
    { label: 'Title', ok: Boolean(input.title?.trim()) },
    { label: 'Company', ok: Boolean(input.company?.trim()) },
    { label: 'Bio', ok: Boolean(input.bio?.trim()) },
    { label: 'Skills', ok: Boolean(input.skills?.length) },
  ]
  const done = checks.filter((check) => check.ok).length
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((check) => !check.ok).map((check) => check.label),
  }
}

export const validateMenteeProfile = (input: {
  goals?: string[]
  interests?: string[]
}): ProfileValidationResult => {
  if (!input.goals?.length) {
    return { ok: false, message: 'Add at least one goal.' }
  }
  if (!input.interests?.length) {
    return { ok: false, message: 'Add at least one interest.' }
  }
  return { ok: true }
}
