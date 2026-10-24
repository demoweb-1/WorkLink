const KEY = 'wl_recent'
export function getRecent(): string[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[] } catch { return [] } }
export function pushRecent(slug: string) { try { localStorage.setItem(KEY, JSON.stringify([slug, ...getRecent().filter(s => s !== slug)].slice(0, 4))) } catch { /* storage blocked */ } }
export function getDistrict() { try { return localStorage.getItem('wl_district') ?? '' } catch { return '' } }
export function setDistrictPref(d: string) { try { localStorage.setItem('wl_district', d) } catch { /* ignore */ } }
export function getPhone() { try { return localStorage.getItem('wl_phone') ?? '' } catch { return '' } }
export function setPhonePref(p: string) { try { localStorage.setItem('wl_phone', p) } catch { /* ignore */ } }
export type LastRequest = { id: string; token: string }
export function getLastRequest(): LastRequest | null { try { return JSON.parse(localStorage.getItem('wl_last_request') ?? 'null') as LastRequest | null } catch { return null } }
export function setLastRequest(r: LastRequest | null) { try { r ? localStorage.setItem('wl_last_request', JSON.stringify(r)) : localStorage.removeItem('wl_last_request') } catch { /* ignore */ } }
