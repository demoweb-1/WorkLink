const KEY = 'wl_recent'
export function getRecent(): string[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[] } catch { return [] } }
export function pushRecent(slug: string) { try { localStorage.setItem(KEY, JSON.stringify([slug, ...getRecent().filter(s => s !== slug)].slice(0, 4))) } catch { /* storage blocked */ } }
export function getDistrict() { try { return localStorage.getItem('wl_district') ?? '' } catch { return '' } }
export function setDistrictPref(d: string) { try { localStorage.setItem('wl_district', d) } catch { /* ignore */ } }
