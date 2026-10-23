import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DISTRICTS } from '../lib/constants'
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'

export default function Account() {
  const { session, profile, refreshProfile, signOut } = useAuth()
  const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  useEffect(() => { if (session) supabase.from('profile_private').select('phone_number').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setPhone(data?.phone_number ?? '')) }, [session])
  async function savePhone() {
    const d = phone.replace(/[\s-]/g, '')
    const n = /^0\d{9}$/.test(d) ? '+94' + d.slice(1) : d
    if (!/^\+94\d{9}$/.test(n)) return setErr('Enter a Sri Lankan number like 0771234567.')
    setErr(null); const { error } = await supabase.from('profile_private').upsert({ user_id: session!.user.id, phone_number: n }, { onConflict: 'user_id' })
    if (error) setErr('Could not save your phone number.'); else { setPhone(n); setMsg('Phone number saved. It is shown only to the other person in a booking.') }
  }
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
      <section className={`${cardCls} space-y-3 p-5`}>
        <label className={labelCls}>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="0771234567" className={inputCls} /></label>
        <p className="text-sm text-muted">Only the other person in a confirmed booking can see this.</p>
        <button onClick={savePhone} className={btnSecondary}>Save phone number</button>
      </section>
      <section className={`${cardCls} p-5`}>
        <h2 className="font-semibold">Worker mode</h2>
        <p className="mt-1 text-muted">{profile.is_worker ? 'You can list services and appear in the worker directory.' : 'Turn this on to list your services and be found by customers.'}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {profile.is_worker ? <><Link to="/my-services" className={btnPrimary}>Manage my services</Link><button onClick={() => update({ is_worker: false }, 'Worker mode is off. Your listings are hidden.')} className={btnSecondary}>Turn off</button></>
            : <button onClick={() => update({ is_worker: true }, 'Worker mode is on.')} className={btnPrimary}>Turn on worker mode</button>}
        </div>
      </section>
      {err && <p role="alert" className="pop text-error">{err}</p>}{msg && <p role="status" className="pop text-success">{msg}</p>}<button onClick={signOut} className={btnSecondary}>Sign out</button>
    </div>)
}
