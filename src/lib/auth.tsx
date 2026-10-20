import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type Ctx = { session: Session | null; loading: boolean; signOut: () => Promise<void> }
const AuthCtx = createContext<Ctx>({ session: null, loading: true, signOut: async () => {} })
export const useAuth = () => useContext(AuthCtx)

// Create the profile row on first sign-in (display name is stored in auth metadata at sign-up).
async function ensureProfile(session: Session) {
  const { data } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle()
  if (data) return
  const m = session.user.user_metadata as { display_name?: string; is_worker?: boolean }
  const { error } = await supabase.from('profiles').insert({
    id: session.user.id,
    display_name: m.display_name ?? session.user.email?.split('@')[0] ?? 'New user',
    is_worker: Boolean(m.is_worker),
  })
  if (error) console.error('Profile creation failed:', error.message)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) setTimeout(() => ensureProfile(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])
  return <AuthCtx.Provider value={{ session, loading, signOut: async () => { await supabase.auth.signOut() } }}>{children}</AuthCtx.Provider>
}
