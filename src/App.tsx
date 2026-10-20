import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Landing from './pages/Landing'
import { SignIn, SignUp } from './pages/AuthPages'
import Account from './pages/Account'

export const BRAND = 'WorkLink'  // change the product name here

function Header() {
  const { session, signOut } = useAuth()
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight">{BRAND}<span className="text-lime">.</span></Link>
        <nav className="flex items-center gap-2 text-sm">
          {session ? (<>
            <Link className="px-3 py-2 min-h-11 inline-flex items-center" to="/account">Account</Link>
            <button onClick={signOut} className="rounded-xl border border-line px-4 min-h-11">Sign out</button>
          </>) : (<>
            <Link className="px-3 py-2 min-h-11 inline-flex items-center" to="/signin">Sign in</Link>
            <Link className="rounded-xl bg-brand px-4 min-h-11 inline-flex items-center font-medium text-white hover:bg-brand-dark" to="/signup">Create account</Link>
          </>)}
        </nav>
      </div>
    </header>)
}

function Protected({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="p-6 text-muted">Loading…</p>
  return session ? children : <Navigate to="/signin" replace />
}

export default function App() {
  return (<>
    <Header />
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/account" element={<Protected><Account /></Protected>} />
        <Route path="*" element={<p>Page not found. <Link className="text-brand underline" to="/">Go home</Link></p>} />
      </Routes>
    </main>
  </>)
}
