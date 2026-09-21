import { getBlocksClient } from '@/lib/blocks/client'
import { readBlocksError } from '@/lib/profiles/errors'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

type PresignResponse = {
  uploadUrl?: string
  fileId?: string
  isSuccess?: boolean
  errors?: unknown
}

type FileGetResponse = {
  downloadUrl?: string
  DownloadUrl?: string
  url?: string
  Url?: string
}

export const validateProfilePhotoFile = (file: File): string | undefined => {
  if (!file.type.startsWith('image/')) {
    return 'Choose a JPG, PNG, or WebP image.'
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }
  return undefined
}

export const uploadProfilePhoto = async (
  file: File,
  tags = 'profile,mentor'
): Promise<string> => {
  const validationError = validateProfilePhotoFile(file)
  if (validationError) throw new Error(validationError)

  const client = getBlocksClient()
  const presign = (await client.data.files.presignedUploadUrl({
    name: file.name,
    configurationName: 'Default',
    accessModifier: 'Private',
    tags,
  })) as PresignResponse

  if (!presign.isSuccess || !presign.uploadUrl || !presign.fileId) {
    throw new Error('Photo upload could not start. Try again.')
  }

  await client.data.files.uploadToUrl({
    url: presign.uploadUrl,
    body: file,
    contentType: file.type || 'application/octet-stream',
  })

  return presign.fileId
}

export const getProfilePhotoUrl = async (fileId: string): Promise<string | undefined> => {
  try {
    const result = (await getBlocksClient().data.files.get(fileId, {
      configurationName: 'Default',
    })) as FileGetResponse

    return result.downloadUrl ?? result.DownloadUrl ?? result.url ?? result.Url
  } catch (error) {
    throw new Error(readBlocksError(error))
  }
}
