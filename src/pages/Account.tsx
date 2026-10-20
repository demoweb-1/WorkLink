import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DISTRICTS } from '../lib/constants'
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'

export default function Account() {
  const { session, profile, refreshProfile } = useAuth()
  const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)
  if (!profile) return <p className="text-muted">Loading…</p>
  async function update(patch: Partial<{ is_worker: boolean; district: string | null }>, ok: string) {
    setMsg(null); setErr(null)
    const { error } = await supabase.from('profiles').update(patch).eq('id', session!.user.id)
    if (error) setErr('Could not save your changes. Try again.'); else { setMsg(ok); await refreshProfile() }
  }
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Hello, {profile.display_name}</h1>
      <section className={`${cardCls} space-y-4 p-5`}>
        <label className={labelCls}>Your district<select value={profile.district ?? ''} onChange={e => update({ district: e.target.value || null }, 'District saved.')} className={inputCls}>
          <option value="">Not set</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></label>
      </section>
      <section className={`${cardCls} p-5`}>
        <h2 className="font-semibold">Worker mode</h2>
        <p className="mt-1 text-muted">{profile.is_worker ? 'You can list services and appear in the worker directory.' : 'Turn this on to list your services and be found by customers.'}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {profile.is_worker ? <><Link to="/my-services" className={btnPrimary}>Manage my services</Link><button onClick={() => update({ is_worker: false }, 'Worker mode is off. Your listings are hidden.')} className={btnSecondary}>Turn off</button></>
            : <button onClick={() => update({ is_worker: true }, 'Worker mode is on.')} className={btnPrimary}>Turn on worker mode</button>}
        </div>
      </section>
      {err && <p role="alert" className="text-error">{err}</p>}{msg && <p role="status" className="text-success">{msg}</p>}
    </div>)
}
