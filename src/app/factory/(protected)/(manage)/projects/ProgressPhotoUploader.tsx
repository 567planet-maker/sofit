'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import FileUploader, { type UploadedFile } from '@/components/common/FileUploader'
import { addProgressPhoto, deleteProgressPhoto } from '@/app/actions/factory'

type Photo = {
  id: string
  file_url: string
  file_name: string | null
  file_size: number | null
  signedUrl: string | null
}

type Props = {
  requestId: string
  initialPhotos: Photo[]
}

export default function ProgressPhotoUploader({ requestId, initialPhotos }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  const handleSave = () => {
    if (uploadedFiles.length === 0) return
    setErrorMsg(null)
    startTransition(async () => {
      for (const f of uploadedFiles) {
        const result = await addProgressPhoto(requestId, f.path, f.fileName, f.fileSize)
        if (result.error) {
          setErrorMsg(result.error)
          return
        }
      }
      setUploadedFiles([])
      router.refresh()
    })
  }

  const handleDelete = (photoId: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await deleteProgressPhoto(photoId)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setDeleteId(null)
        setPhotos((prev) => prev.filter((p) => p.id !== photoId))
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* 기존 사진 그리드 */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) =>
            photo.signedUrl ? (
              <div key={photo.id} className="relative">
                <a href={photo.signedUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.signedUrl}
                    alt={photo.file_name ?? '진행 사진'}
                    className="aspect-square w-full rounded-card object-cover"
                  />
                </a>
                {deleteId === photo.id ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-card bg-black/60">
                    <p className="text-xs font-medium text-white">삭제?</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(photo.id)}
                        disabled={isPending}
                        className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white disabled:opacity-50"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="rounded-lg bg-white/20 px-3 py-1 text-xs text-white"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(photo.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white hover:bg-black/70"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-subtle">아직 등록된 진행 사진이 없습니다.</p>
      )}

      {/* 새 사진 업로드 */}
      <div className="rounded-card border border-border bg-surface-muted p-4">
        <p className="mb-3 text-xs font-medium text-ink-muted">진행 사진 추가</p>
        <FileUploader
          bucket="progress-photos"
          fileType="image"
          accept=".jpg,.jpeg,.png,.webp"
          maxSizeMb={10}
          label="사진 업로드"
          hint="jpg, png, webp 형식"
          onChange={handleUploadComplete}
        />
        {uploadedFiles.length > 0 && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="mt-3 w-full rounded-card bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {isPending ? '저장 중...' : `${uploadedFiles.length}장 저장`}
          </button>
        )}
        {errorMsg && <p className="mt-2 text-xs text-danger">{errorMsg}</p>}
      </div>
    </div>
  )
}
