import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

type Category = { id: string; name: string; slug: string }

export default function Landing() {
  const [cats, setCats] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!isConfigured) { setError('Supabase is not configured. Add the values from .env.example to .env.'); return }
    supabase.from('service_categories').select('id,name,slug').eq('is_active', true).order('name')
      .then(({ data, error }) => error ? setError('Could not load services. Check your connection and try again.') : setCats(data))
  }, [])
  return (
    <div className="space-y-12">
      <section className="py-6">
        <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">Find the right person for the job.</h1>
        <p className="mt-4 max-w-lg text-lg text-muted">Discover skilled local professionals or post your job and compare offers from workers ready to help.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-xl bg-brand px-5 min-h-11 inline-flex items-center font-medium text-white hover:bg-brand-dark">Create an account</Link>
          <Link to="/signin" className="rounded-xl border border-line bg-white px-5 min-h-11 inline-flex items-center font-medium">Sign in</Link>
        </div>
        <p className="mt-3 text-sm text-muted">Payment is arranged directly between customer and worker.</p>
      </section>
      <section aria-labelledby="svc">
        <h2 id="svc" className="text-2xl font-semibold">Services</h2>
        {error && <p role="alert" className="mt-4 rounded-xl border border-line bg-white p-4 text-error">{error}</p>}
        {!error && cats === null && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-subtle" />)}</div>}
        {cats?.length === 0 && <p className="mt-4 text-muted">No services have been added yet.</p>}
        {cats && cats.length > 0 && <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cats.map(c => <li key={c.id} className="rounded-2xl border border-line bg-white p-4 font-medium">{c.name}</li>)}</ul>}
      </section>
    </div>)
}
