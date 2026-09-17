import { BlocksApiError } from '@seliseblocks/client'

export const readBlocksError = (error: unknown): string => {
  if (error instanceof BlocksApiError) {
    const body = error.body
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (error.status === 403) {
      return 'You do not have permission to save this profile. Contact support if this persists.'
    }
    return error.statusText || 'Request failed. Please try again.'
  }

  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}

export const isDuplicateProfileError = (error: unknown): boolean => {
  const message = readBlocksError(error).toLowerCase()
  return /duplicate|already exists|unique|conflict/i.test(message)
}
