import { STATUS } from '../lib/jobs'
const TONE: Record<string, string> = {
  open: 'bg-brand-soft text-brand', accepted: 'bg-green-50 text-success', in_progress: 'bg-amber-50 text-warning', completed: 'bg-green-50 text-success',
  pending: 'bg-subtle text-ink', declined: 'bg-subtle text-muted', withdrawn: 'bg-subtle text-muted', closed: 'bg-subtle text-muted', cancelled: 'bg-red-50 text-error', draft: 'bg-subtle text-muted' }
export default function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[status] ?? 'bg-subtle'}`}>{STATUS[status] ?? status}</span>
}
