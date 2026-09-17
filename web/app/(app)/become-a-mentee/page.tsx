import { redirect } from 'next/navigation'

export default function BecomeAMenteePage() {
  redirect('/onboarding?as=mentee')
}
