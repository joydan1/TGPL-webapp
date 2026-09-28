import { useVideoUploads, useUploadGuard } from '../store/videoUploads'

const TRAY_CSS = `
  .ut-tray { position: fixed; right: 1rem; bottom: 1rem; width: min(340px, calc(100vw - 2rem)); background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; box-shadow: 0 12px 32px rgba(0,0,0,0.15); z-index: 400; overflow: hidden; }
  .ut-head { padding: 0.7rem 1rem; font-size: 0.8rem; font-weight: 700; color: #111827; background: #F9FAFB; border-bottom: 1px solid #F3F4F6; }
  .ut-row { padding: 0.7rem 1rem; border-top: 1px solid #F3F4F6; display: grid; gap: 0.4rem; }
  .ut-row:first-of-type { border-top: none; }
  .ut-name { font-size: 0.8rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ut-sub { font-size: 0.72rem; color: #6B7280; }
  .ut-sub.error { color: #B91C1C; }
  .ut-bar { height: 4px; background: #E5E7EB; border-radius: 999px; overflow: hidden; }
  .ut-bar-fill { height: 100%; background: #2492EB; transition: width 0.2s; }
  .ut-actions { display: flex; gap: 0.75rem; }
  .ut-link { background: none; border: none; padding: 0; font-size: 0.72rem; font-weight: 700; color: #2492EB; cursor: pointer; }
`

export default function UploadTray() {
  useUploadGuard()
  const jobs = useVideoUploads((s) => s.jobs)
  const cancel = useVideoUploads((s) => s.cancel)
  const retry = useVideoUploads((s) => s.retry)

  const visible = Object.values(jobs).filter((j) => j.status !== 'done')
  if (visible.length === 0) return null

  return (
    <div className="ut-tray">
      <style>{TRAY_CSS}</style>
      <div className="ut-head">
        Uploading videos ({visible.filter((j) => j.status !== 'error').length} active
        {visible.some((j) => j.status === 'error') ? ', some failed' : ''})
      </div>
      {visible.map((job) => (
        <div className="ut-row" key={job.key}>
          <div className="ut-name">{job.lessonTitle || job.file.name}</div>
          {job.status === 'error' ? (
            <>
              <div className="ut-sub error">{job.error || 'Upload failed.'}</div>
              <div className="ut-actions">
                <button className="ut-link" onClick={() => retry(job.key)}>Retry</button>
                <button className="ut-link" onClick={() => cancel(job.key)}>Remove</button>
              </div>
            </>
          ) : (
            <>
              <div className="ut-bar"><div className="ut-bar-fill" style={{ width: `${job.progress}%` }} /></div>
              <div className="ut-sub">
                {job.note ?? (job.status === 'queued' ? 'Waiting…' : `${job.progress}%`)}
              </div>
              <div className="ut-actions">
                <button className="ut-link" onClick={() => cancel(job.key)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}