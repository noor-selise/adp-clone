'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { ProfileField } from '@/components/profile/profile-field'
import { getProfilePhotoUrl, uploadProfilePhoto, validateProfilePhotoFile } from '@/lib/profiles/photo'
import { readBlocksError } from '@/lib/profiles/errors'

type ProfilePhotoFieldProps = {
  fileId?: string
  displayName?: string
  onFileIdChange: (fileId: string | undefined) => void
  onError?: (message: string | undefined) => void
}

export const ProfilePhotoField = ({
  fileId,
  displayName,
  onFileIdChange,
  onError,
}: ProfilePhotoFieldProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!fileId) {
      setPreviewUrl(undefined)
      return
    }

    let cancelled = false
    void getProfilePhotoUrl(fileId)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(undefined)
      })

    return () => {
      cancelled = true
    }
  }, [fileId])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationError = validateProfilePhotoFile(file)
    if (validationError) {
      onError?.(validationError)
      return
    }

    setUploading(true)
    onError?.(undefined)
    try {
      const nextFileId = await uploadProfilePhoto(file)
      onFileIdChange(nextFileId)
      const url = await getProfilePhotoUrl(nextFileId)
      setPreviewUrl(url)
    } catch (caught) {
      onError?.(readBlocksError(caught))
    } finally {
      setUploading(false)
    }
  }

  const initials =
    (displayName ?? 'M')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'M'

  return (
    <ProfileField label="Profile photo" hint="Square images work best. Max 5 MB.">
      <div className="flex items-center gap-4">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg-inset)] text-lg font-semibold text-[var(--color-text-muted)]"
          aria-hidden={Boolean(previewUrl)}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg-inset)]">
            {uploading ? 'Uploading…' : fileId ? 'Change photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void handleFileChange(e)}
            />
          </label>
          {fileId ? (
            <button
              type="button"
              className="block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              onClick={() => {
                onFileIdChange(undefined)
                setPreviewUrl(undefined)
              }}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
    </ProfileField>
  )
}
