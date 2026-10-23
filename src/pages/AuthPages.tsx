import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

import { inputCls as input, btnPrimary } from '../lib/ui'
const btn = btnPrimary + ' w-full'

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="mx-auto max-w-sm"><h1 className="mb-6 text-4xl font-bold tracking-tight">{title}</h1>{children}</div>
}

export function SignIn() {
  const { session } = useAuth(); const nav = useNavigate()
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null)
  if (session) return <Navigate to="/account" replace />
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const f = new FormData(e.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get('email')), password: String(f.get('password')) })
    setBusy(false)
    if (error) setMsg(error.message === 'Email not confirmed' ? 'Please confirm your email first. Check your inbox.' : 'Incorrect email or password.')
    else nav('/account')
  }
  async function reset() {
    const email = (document.getElementById('email') as HTMLInputElement).value
    if (!email) return setMsg('Enter your email above, then select "Forgot password".')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setMsg(error ? 'Could not send the reset email. Try again later.' : 'If that email has an account, a reset link is on its way.')
  }
  return <Shell title="Sign in">
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Email<input id="email" name="email" type="email" required autoComplete="email" className={input} /></label>
      <label className="block text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className={input} /></label>
      {msg && <p role="alert" className="text-sm text-error">{msg}</p>}
      <button className={btn} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <button onClick={reset} className="mt-3 text-sm text-brand underline">Forgot password</button>
    <p className="mt-6 text-sm text-muted">New here? <Link className="text-brand underline" to="/signup">Create an account</Link></p>
  </Shell>
}

export function SignUp() {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null); const [sent, setSent] = useState(false)
  if (session) return <Navigate to="/account" replace />
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const f = new FormData(e.currentTarget)
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get('email')), password: String(f.get('password')),
      options: { data: { display_name: String(f.get('name')).trim(), is_worker: f.get('worker') === 'on' }, emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (!data.session) setSent(true)
  }
  if (sent) return <Shell title="Check your email"><p className="text-muted">We sent a confirmation link. Open it, then sign in.</p></Shell>
  return <Shell title="Create account">
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Your name<input name="name" autoComplete="name" required minLength={2} maxLength={60} className={input} /></label>
      <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className={input} /></label>
      <label className="block text-sm font-medium">Password (8+ characters)<input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input name="worker" type="checkbox" className="size-5" /> I also want to offer my services as a worker</label>
      {msg && <p role="alert" className="text-sm text-error">{msg}</p>}
      <button className={btn} disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
    </form>
    <p className="mt-6 text-sm text-muted">Already registered? <Link className="text-brand underline" to="/signin">Sign in</Link></p>
  </Shell>
}
