import { useRef, useState } from 'react'
import { Mic, Square, Trash2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { btnSecondary } from '../lib/ui'

// Record up to 60 seconds. Hidden on browsers that cannot record.
export default function VoiceRecorder({ onChange }: { onChange: (b: Blob | null) => void }) {
  const { t } = useI18n()
  const [rec, setRec] = useState(false); const [url, setUrl] = useState<string | null>(null); const [denied, setDenied] = useState(false)
  const mr = useRef<MediaRecorder | null>(null); const timer = useRef(0)
  if (typeof MediaRecorder === 'undefined') return null
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = ['audio/webm', 'audio/mp4'].find(x => MediaRecorder.isTypeSupported(x))
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined); const chunks: Blob[] = []
      r.ondataavailable = e => chunks.push(e.data)
      r.onstop = () => { stream.getTracks().forEach(x => x.stop()); const b = new Blob(chunks, { type: r.mimeType }); setUrl(URL.createObjectURL(b)); onChange(b); setRec(false) }
      r.start(); mr.current = r; setRec(true); setDenied(false)
      timer.current = window.setTimeout(() => { if (r.state === 'recording') r.stop() }, 60_000)
    } catch { setDenied(true) }
  }
  function stop() { window.clearTimeout(timer.current); mr.current?.stop() }
  function clear() { setUrl(null); onChange(null) }
  return (
    <div className="space-y-2"><p className="text-sm font-medium">{t('rq.voice')}</p>
      {rec ? <button type="button" onClick={stop} className={`${btnSecondary} !min-h-14 w-full text-lg text-error`}><Square size={20} aria-hidden />{t('rq.stop')}</button>
        : url ? <div className="flex items-center gap-2"><audio controls src={url} className="min-w-0 flex-1" /><button type="button" onClick={clear} aria-label={t('rq.rm')} className="grid size-12 place-items-center rounded-full border border-line bg-white"><Trash2 size={20} aria-hidden /></button></div>
        : <button type="button" onClick={start} className={`${btnSecondary} !min-h-14 w-full text-lg`}><Mic size={22} aria-hidden />{t('rq.rec')}</button>}
      {denied && <p role="alert" className="text-sm text-error">{t('rq.micdenied')}</p>}
    </div>)
}
