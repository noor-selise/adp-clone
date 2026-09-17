import { getBlocksClient } from './client'

export type SignupPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export type SignupOutcome =
  | { kind: 'active' }
  | { kind: 'pending'; email: string }
  | { kind: 'error'; message: string }

const readMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Registration failed. Please try again.'
}

export const checkEmailAvailable = async (email: string): Promise<boolean> => {
  const result = (await getBlocksClient().iam.users.emailAvailable({ email })) as {
    isAvailable?: boolean
    IsAvailable?: boolean
  }
  if (result.isAvailable === false || result.IsAvailable === false) return false
  return true
}

export const signupAccount = async (payload: SignupPayload): Promise<SignupOutcome> => {
  try {
    const response = (await getBlocksClient().auth.signup(payload)) as Record<string, unknown>

    const active =
      response.active === true ||
      response.isActive === true ||
      response.status === 1 ||
      response.status === 'Active'

    if (active) return { kind: 'active' }

    const pending =
      response.active === false ||
      response.isActive === false ||
      response.requiresActivation === true ||
      response.isVerified === false

    if (pending) return { kind: 'pending', email: payload.email }

    return { kind: 'active' }
  } catch (caught) {
    const message = readMessage(caught)
    if (/sign.?up|registration|disabled|not enabled/i.test(message)) {
      return { kind: 'error', message: 'Registration is not available right now. Please try again later.' }
    }
    return { kind: 'error', message }
  }
}

export const validateActivationCode = async (code: string): Promise<boolean> => {
  const result = (await getBlocksClient().auth.validateActivation({ code })) as {
    valid?: boolean
    isValid?: boolean
  }
  return result.valid === true || result.isValid === true
}

export const activateAccount = async (code: string, password: string): Promise<void> => {
  await getBlocksClient().auth.activate({ code, password })
}

export const resendActivation = async (email: string): Promise<void> => {
  await getBlocksClient().auth.resendActivation({ email })
}
