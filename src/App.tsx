import { Link, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuth } from './lib/auth'
import { ADVANCED_JOBS } from './lib/constants'
import { IS_WORKER_APP } from './lib/app'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Workers from './pages/Workers'
import QuickFind from './pages/QuickFind'
import RequestPage from './pages/RequestPage'
import WorkerHome from './pages/WorkerHome'
import WorkerProfile from './pages/WorkerProfile'
import MyServices from './pages/MyServices'
import Account from './pages/Account'
import JobsHub from './pages/JobsHub'
import PostJob from './pages/PostJob'
import JobDetail from './pages/JobDetail'
import Bookings from './pages/Bookings'
import BookingDetail from './pages/BookingDetail'
import { SignIn, SignUp } from './pages/AuthPages'

function Protected({ children }: { children: ReactElement }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="text-muted">Loading…</p>
  return session ? children : <Navigate to="/signin" replace />
}
const NotFound = () => <p>Page not found. <Link className="text-brand underline" to="/">Go home</Link></p>

// One code base, two apps. The build mode decides which set of screens exists.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="signin" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="account" element={<Protected><Account /></Protected>} />
        <Route path="workers/:id" element={<WorkerProfile />} />
        {IS_WORKER_APP ? <>
          <Route index element={<WorkerHome />} />
          <Route path="my-services" element={<Protected><MyServices /></Protected>} />
        </> : <>
          <Route index element={<Landing />} />
          <Route path="find/:slug" element={<QuickFind />} />
          <Route path="request" element={<RequestPage />} />
          <Route path="request/:slug" element={<RequestPage />} />
          <Route path="workers" element={<Workers />} />
          {ADVANCED_JOBS && <>
            <Route path="jobs" element={<Protected><JobsHub /></Protected>} />
            <Route path="jobs/new" element={<Protected><PostJob /></Protected>} />
            <Route path="jobs/:id" element={<Protected><JobDetail /></Protected>} />
            <Route path="bookings" element={<Protected><Bookings /></Protected>} />
            <Route path="bookings/:id" element={<Protected><BookingDetail /></Protected>} />
          </>}
        </>}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>)
}
