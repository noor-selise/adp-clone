/** Score overlap between mentor matchTags and mentee tags. */
export const scoreMentorMenteeMatch = (mentorTags, menteeTags) => {
  const mentor = new Set(mentorTags.map((tag) => tag.toLowerCase()))
  let score = 0
  for (const tag of menteeTags) {
    const normalized = tag.toLowerCase()
    if (mentor.has(normalized)) score += 3
    for (const mentorTag of mentor) {
      if (mentorTag.includes(normalized) || normalized.includes(mentorTag)) score += 1
    }
  }
  return score
}

const domainsOverlap = (mentorDomains, menteeDomains) =>
  mentorDomains.some((domain) => menteeDomains.includes(domain))

export const buildSkillMatchedAssignments = (mentors, mentees, perMentee = 5) => {
  const pairs = new Set()
  const results = []

  const addPair = (mentorEmail, menteeEmail) => {
    const key = `${mentorEmail}:${menteeEmail}`
    if (pairs.has(key)) return false
    pairs.add(key)
    results.push({ mentorEmail, menteeEmail })
    return true
  }

  for (const mentee of mentees) {
    const eligible = mentors.filter((mentor) =>
      domainsOverlap(mentor.domains ?? [], mentee.domains ?? [])
    )

    const ranked = eligible
      .map((mentor) => ({
        mentor,
        score: scoreMentorMenteeMatch(mentor.matchTags, mentee.matchTags),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)

    let added = 0
    for (const entry of ranked) {
      if (added >= perMentee) break
      if (addPair(entry.mentor.email, mentee.email)) added += 1
    }

    // ponytail: fill remaining slots with same-domain mentors when tag scores tie sparse pools
    if (added < perMentee) {
      for (const mentor of eligible) {
        if (added >= perMentee) break
        if (addPair(mentor.email, mentee.email)) added += 1
      }
    }
  }

  return results
}
