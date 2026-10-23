import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DISTRICTS, priceText, type Cat } from '../lib/constants'
import { normalizePhone } from '../lib/phone'
import { btnDanger, btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'

type Mine = { id: string; service_title: string; indicative_price: number | null; price_type: string; service_areas: string[]; is_active: boolean; service_categories: { name: string } | null }

export default function MyServices() {
  const { session, profile } = useAuth()
  const [items, setItems] = useState<Mine[] | null>(null)
  const [cats, setCats] = useState<Cat[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [type, setType] = useState('fixed')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const uid = session?.user.id
  const [cPhone, setCPhone] = useState(''); const [cWa, setCWa] = useState(true); const [cMsg, setCMsg] = useState<string | null>(null); const [hasContact, setHasContact] = useState(false)
  useEffect(() => { if (uid) supabase.from('worker_contacts').select('phone,whatsapp').eq('worker_id', uid).maybeSingle().then(({ data }) => { if (data) { setCPhone(data.phone); setCWa(data.whatsapp); setHasContact(true) } }) }, [uid])
  async function saveContact() {
    const n = normalizePhone(cPhone); if (!n) return setCMsg('Enter a Sri Lankan number like 0771234567.')
    const { error } = await supabase.from('worker_contacts').upsert({ worker_id: uid, phone: n, whatsapp: cWa, updated_at: new Date().toISOString() }, { onConflict: 'worker_id' })
    if (error) return setCMsg('Could not save. Has the 0003 database update been run?'); setCPhone(n); setHasContact(true); setCMsg('Saved. Customers can now call you from your listings.')
  }
  async function removeContact() { await supabase.from('worker_contacts').delete().eq('worker_id', uid!); setCPhone(''); setHasContact(false); setCMsg('Your number is no longer shown.') }

  async function load() {
    if (!uid) return
    const { data, error } = await supabase.from('worker_services').select('id,service_title,indicative_price,price_type,service_areas,is_active,service_categories(name)').eq('worker_id', uid).order('created_at', { ascending: false })
    if (error) setErr('Could not load your services.'); else setItems((data ?? []) as unknown as Mine[])
  }
  useEffect(() => { load(); supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name').then(({ data }) => setCats((data ?? []) as Cat[]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  if (profile && !profile.is_worker) return <div><h1 className="text-3xl font-bold">My services</h1><p className="mt-2 text-muted">Switch on worker mode in your <Link className="text-brand underline" to="/account">account</Link> to list services.</p></div>

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null); setOk(null)
    const f = new FormData(e.currentTarget)
    const title = String(f.get('title')).trim(); const price = Number(f.get('price'))
    if (title.length < 3) return setErr('Enter a service title of at least 3 characters.')
    if (!f.get('category')) return setErr('Choose a service category.')
    if (type !== 'contact' && !(price > 0)) return setErr('Enter a price greater than zero, or choose "Contact for price".')
    if (areas.length === 0) return setErr('Select at least one district you serve.')
    setSaving(true)
    const { error } = await supabase.from('worker_services').insert({
      worker_id: uid, category_id: String(f.get('category')), service_title: title, description: String(f.get('description')).trim() || null,
      price_type: type, indicative_price: type === 'contact' ? null : price, service_areas: areas,
      years_experience: f.get('years') ? Number(f.get('years')) : null,
    })
    setSaving(false)
    if (error) return setErr('Could not save this service. Check the details and try again.')
    form.current?.reset(); setAreas([]); setType('fixed'); setOk('Service added. It is now visible in the worker directory.'); load()
  }
  async function toggle(s: Mine) { await supabase.from('worker_services').update({ is_active: !s.is_active }).eq('id', s.id); load() }
  async function remove(s: Mine) { if (window.confirm(`Delete "${s.service_title}"? This cannot be undone.`)) { await supabase.from('worker_services').delete().eq('id', s.id); load() } }

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight">My services</h1>
      <section aria-labelledby="ct" className={`${cardCls} space-y-3 p-5`}>
        <h2 id="ct" className="text-xl font-bold">Let customers call you</h2>
        <p className="text-sm text-muted">This number will be visible to everyone who views your listings. Only add it if you are happy for anyone to call you.</p>
        <label className={labelCls}>Phone number<input value={cPhone} onChange={e => setCPhone(e.target.value)} inputMode="tel" placeholder="0771234567" className={inputCls} /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={cWa} onChange={e => setCWa(e.target.checked)} className="size-5" /> Customers can also message me on WhatsApp</label>
        {cMsg && <p role="status" className="pop text-sm">{cMsg}</p>}
        <div className="flex flex-wrap gap-3"><button onClick={saveContact} className={btnPrimary}>Save number</button>{hasContact && <button onClick={removeContact} className={btnDanger}>Stop showing my number</button>}</div>
      </section>
      <section aria-labelledby="cur">
        <h2 id="cur" className="text-xl font-bold">Your listings</h2>
        {items === null ? <div className="mt-3 h-24 animate-pulse rounded-2xl bg-subtle" /> : items.length === 0 ? <p className="mt-3 text-muted">You have not added a service yet. Add your first one below.</p> :
          <ul className="mt-3 space-y-3">{items.map(s => (<li key={s.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div><p className="font-semibold">{s.service_title}</p><p className="text-sm text-muted">{s.service_categories?.name} · {priceText(s.indicative_price, s.price_type)} · {s.is_active ? 'Visible' : 'Hidden'}</p></div>
            <div className="flex gap-2"><button onClick={() => toggle(s)} className={`${btnSecondary} !min-h-11 text-sm`}>{s.is_active ? 'Hide' : 'Show'}</button><button onClick={() => remove(s)} className={btnDanger}>Delete</button></div></li>))}</ul>}
      </section>
      <section aria-labelledby="add">
        <h2 id="add" className="text-xl font-bold">Add a service</h2>
        <form ref={form} onSubmit={add} className={`${cardCls} mt-3 space-y-4 p-5`}>
          <label className={labelCls}>Category<select name="category" className={inputCls} defaultValue=""><option value="" disabled>Choose a category</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className={labelCls}>Service title<input name="title" maxLength={80} placeholder="House wiring and repairs" className={inputCls} /></label>
          <label className={labelCls}>Description (optional)<textarea name="description" maxLength={600} rows={3} className={`${inputCls} py-2`} /></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelCls}>Price type<select value={type} onChange={e => setType(e.target.value)} className={inputCls}><option value="fixed">Fixed price</option><option value="hourly">Per hour</option><option value="daily">Per day</option><option value="contact">Contact for price</option></select></label>
            {type !== 'contact' && <label className={labelCls}>Price from (Rs.)<input name="price" type="number" inputMode="numeric" min={1} className={inputCls} /></label>}
            <label className={labelCls}>Years of experience<input name="years" type="number" inputMode="numeric" min={0} max={60} className={inputCls} /></label>
          </div>
          <fieldset><legend className={labelCls}>Districts you serve</legend>
            <div className="mt-2 flex flex-wrap gap-2">{DISTRICTS.map(d => { const on = areas.includes(d); return (
              <button type="button" key={d} aria-pressed={on} onClick={() => setAreas(a => on ? a.filter(x => x !== d) : [...a, d])}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white'}`}>{d}</button>) })}</div></fieldset>
          {err && <p role="alert" className="text-error">{err}</p>}{ok && <p role="status" className="text-success">{ok}</p>}
          <button className={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Add service'}</button>
        </form>
      </section>
    </div>)
}
