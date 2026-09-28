import { create } from 'zustand'
import { useEffect } from 'react'
import { coursesManageAPI } from '../services/api'

export type UploadStatus = 'queued' | 'uploading' | 'error' | 'done'

export interface UploadJob {
  key: string          // lesson remote id — one video per lesson
  token: number        // identifies this attempt; stale runs are ignored
  courseId: string
  lessonTitle: string
  file: File
  status: UploadStatus
  progress: number     // 0–100
  note: string | null  // e.g. "Connection problem — retrying (1/2)…"
  error: string | null
  url: string | null
}

interface EnqueueArgs {
  key: string
  courseId: string
  lessonTitle: string
  file: File
}

interface UploadState {
  jobs: Record<string, UploadJob>
  enqueue: (args: EnqueueArgs) => void
  cancel: (key: string) => void
  retry: (key: string) => void
  dismiss: (key: string) => void
}

const MAX_CONCURRENT = 2
const MAX_ATTEMPTS = 3

const controllers = new Map<string, AbortController>()
let tokenCounter = 0

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    }, { once: true })
  })
}

function abortRunning(key: string) {
  controllers.get(key)?.abort()
  controllers.delete(key)
}

function removeJob(key: string) {
  useVideoUploads.setState((s) => {
    const jobs = { ...s.jobs }
    delete jobs[key]
    return { jobs }
  })
}

function patch(key: string, changes: Partial<UploadJob>, token?: number) {
  useVideoUploads.setState((s) => {
    const job = s.jobs[key]
    if (!job) return s
    if (token !== undefined && job.token !== token) return s
    return { jobs: { ...s.jobs, [key]: { ...job, ...changes } } }
  })
}

export const useVideoUploads = create<UploadState>(() => ({
  jobs: {},

  enqueue: ({ key, courseId, lessonTitle, file }) => {
    abortRunning(key) // replacing a video: stop any earlier upload for this lesson
    const job: UploadJob = {
      key,
      token: ++tokenCounter,
      courseId,
      lessonTitle,
      file,
      status: 'queued',
      progress: 0,
      note: null,
      error: null,
      url: null,
    }
    useVideoUploads.setState((s) => ({ jobs: { ...s.jobs, [key]: job } }))
    pump()
  },

  cancel: (key) => {
    abortRunning(key)
    removeJob(key)
    pump()
  },

  retry: (key) => {
    const job = useVideoUploads.getState().jobs[key]
    if (!job || job.status !== 'error') return
    patch(key, { token: ++tokenCounter, status: 'queued', progress: 0, note: null, error: null })
    pump()
  },

  dismiss: (key) => removeJob(key),
}))

function pump() {
  const jobs = Object.values(useVideoUploads.getState().jobs)
  let running = jobs.filter((j) => j.status === 'uploading').length
  for (const job of jobs) {
    if (running >= MAX_CONCURRENT) break
    if (job.status === 'queued') {
      running++
      void runJob(job.key, job.token)
    }
  }
}

async function runJob(key: string, token: number) {
  const job = useVideoUploads.getState().jobs[key]
  if (!job || job.token !== token) return

  const controller = new AbortController()
  controllers.set(key, controller)
  patch(key, { status: 'uploading', progress: 0, note: null, error: null }, token)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await coursesManageAPI.uploadFile(
      job.file,
      'lesson_video',
      { lesson_id: key },
      {
        signal: controller.signal,
        onProgress: (pct) => patch(key, { progress: pct }, token),
      },
    )

    if (controller.signal.aborted) break

    if (res.success) {
      patch(key, { status: 'done', progress: 100, note: null, error: null, url: res.data.url ?? null }, token)
      break
    }
    if (res.cancelled) break

    if (!res.retryable || attempt === MAX_ATTEMPTS) {
      patch(key, { status: 'error', error: res.error, note: null }, token)
      break
    }

    patch(key, { progress: 0, note: `Connection problem — retrying (${attempt}/${MAX_ATTEMPTS - 1})…` }, token)
    await sleep(2000 * 2 ** (attempt - 1), controller.signal)
    if (controller.signal.aborted) break
  }

  if (controllers.get(key) === controller) controllers.delete(key)
  pump()
}

/** Warns before closing/reloading the tab while any video is still uploading. */
export function useUploadGuard() {
  const jobs = useVideoUploads((s) => s.jobs)
  const active = Object.values(jobs).some((j) => j.status === 'queued' || j.status === 'uploading')

  useEffect(() => {
    if (!active) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [active])
}