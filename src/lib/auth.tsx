import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { disablePush } from './push'

export type Profile = { display_name: string; is_worker: boolean; district: string | null }
type Ctx = { session: Session | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void>; refreshProfile: () => Promise<void> }
const AuthCtx = createContext<Ctx>({ session: null, profile: null, loading: true, signOut: async () => {}, refreshProfile: async () => {} })
export const useAuth = () => useContext(AuthCtx)

const COLS = 'display_name,is_worker,district'
// Loads the profile; creates it on first sign-in (name is stored in auth metadata at sign-up).
async function fetchProfile(s: Session): Promise<Profile | null> {
  let { data } = await supabase.from('profiles').select(COLS).eq('id', s.user.id).maybeSingle()
  if (!data) {
    const m = s.user.user_metadata as { display_name?: string; is_worker?: boolean }
    const { error } = await supabase.from('profiles').insert({
      id: s.user.id, display_name: m.display_name ?? s.user.email?.split('@')[0] ?? 'New user', is_worker: Boolean(m.is_worker),
    })
    if (error) { console.error('Profile creation failed:', error.message); return null }
    ;({ data } = await supabase.from('profiles').select(COLS).eq('id', s.user.id).maybeSingle())
  }
  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  const refreshProfile = useCallback(async () => { if (session) setProfile(await fetchProfile(session)) }, [session])
  useEffect(() => {
    if (!session) { setProfile(null); return }
    const t = setTimeout(() => { fetchProfile(session).then(setProfile) }, 0) // not awaited inside the auth callback
    return () => clearTimeout(t)
  }, [session])
  return <AuthCtx.Provider value={{ session, profile, loading, refreshProfile, signOut: async () => { await disablePush(); await supabase.auth.signOut() } }}>{children}</AuthCtx.Provider>
}
