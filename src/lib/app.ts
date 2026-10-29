// Which app is this build? Set by the Vite mode: `customer` or `worker`.
export const IS_WORKER_APP = __IS_WORKER__
export const CUSTOMER_PATH = '/WorkLink/'
export const WORKER_PATH = '/WorkLink/worker/'
// Both apps live on the same site, so a person signs in once and is signed in to both.
export const APP_HOME = `${window.location.origin}${import.meta.env.BASE_URL}`
