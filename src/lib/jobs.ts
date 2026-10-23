import { lkr } from './constants'
export type Job = {
  id: string; customer_id: string; title: string; description: string; district: string; approximate_location: string | null
  budget_type: string; budget_min: number | null; budget_max: number | null; preferred_date: string | null; status: string; created_at: string
  service_categories: { name: string } | null
}
export const JOB_SELECT = 'id,customer_id,title,description,district,approximate_location,budget_type,budget_min,budget_max,preferred_date,status,created_at,service_categories(name)'
export const STATUS: Record<string, string> = { open: 'Open', draft: 'Draft', accepted: 'Accepted', closed: 'Closed', cancelled: 'Cancelled', pending: 'Pending', declined: 'Declined', withdrawn: 'Withdrawn', in_progress: 'In progress', completed: 'Completed' }
export function budgetText(j: Pick<Job, 'budget_type' | 'budget_min' | 'budget_max'>) {
  if (j.budget_type === 'negotiable' || j.budget_min == null) return 'Budget negotiable'
  if (j.budget_type === 'range' && j.budget_max != null) return `${lkr(Number(j.budget_min))} to ${lkr(Number(j.budget_max))}`
  return lkr(Number(j.budget_min))
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })
