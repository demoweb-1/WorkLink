import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

type Profile = { display_name: string; is_worker: boolean }

export default function Account() {
  const { session } = useAuth()
  const [p, setP] = useState<Profile | null>(null); const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    if (!session) return
    let tries = 0
    const load = async () => {
      const { data, error } = await supabase.from('profiles').select('display_name,is_worker').eq('id', session.user.id).maybeSingle()
      if (error) return setErr('Could not load your profile.')
      if (data) return setP(data)
      if (++tries < 5) setTimeout(load, 600); else setErr('Your profile was not created. Run the SQL migration and sign in again.')
    }
    load()
  }, [session])
  if (err) return <p role="alert" className="text-error">{err}</p>
  if (!p) return <p className="text-muted">Loading…</p>
  return <div><h1 className="text-3xl font-bold">Hello, {p.display_name}</h1>
    <p className="mt-2 text-muted">{p.is_worker ? 'Customer and worker account.' : 'Customer account.'}</p>
    <p className="mt-6 rounded-xl border border-line bg-white p-4 text-sm">Jobs, offers and bookings are the next features to build.</p></div>
}
