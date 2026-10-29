import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { I18nProvider } from './lib/i18n'
import { CUSTOMER_PATH, IS_WORKER_APP, WORKER_PATH } from './lib/app'

document.documentElement.dataset.app = IS_WORKER_APP ? 'worker' : 'customer'

// GitHub Pages serves the customer app for unknown paths. If someone opens a worker-app link directly,
// remember the path and hand over to the worker app, which restores it.
let handOver = false
try {
  if (!IS_WORKER_APP && location.pathname.startsWith(WORKER_PATH.slice(0, -1))) {
    sessionStorage.setItem('wl_redirect', location.pathname + location.search + location.hash)
    location.replace(WORKER_PATH); handOver = true
  } else if (IS_WORKER_APP) {
    const r = sessionStorage.getItem('wl_redirect')
    if (r) { sessionStorage.removeItem('wl_redirect'); if (r.startsWith(WORKER_PATH)) history.replaceState(null, '', r) }
  }
} catch { /* storage blocked: carry on */ }
void CUSTOMER_PATH

if (!handOver) createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><I18nProvider><AuthProvider><App /></AuthProvider></I18nProvider></BrowserRouter></StrictMode>)
