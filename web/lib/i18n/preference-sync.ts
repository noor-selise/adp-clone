export const ignorePreferenceSyncFailure = async <T>(task: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await task()
  } catch {
    return undefined
  }
}
