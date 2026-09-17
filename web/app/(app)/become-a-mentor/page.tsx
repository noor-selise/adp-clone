import { redirect } from 'next/navigation'

export default function BecomeAMentorPage() {
  redirect('/onboarding?as=mentor')
}
