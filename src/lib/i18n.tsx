import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'si' | 'ta'
// NOTE: Sinhala and Tamil are first drafts. Have a native speaker review them before launch.
const dict: Record<Lang, Record<string, string>> = {
  en: { 'nav.home': 'Home', 'nav.workers': 'Workers', 'nav.jobs': 'Jobs', 'nav.bookings': 'Bookings', 'nav.account': 'Account', 'nav.signin': 'Sign in', 'nav.create': 'Create account',
    'home.title': 'What do you need today?', 'home.sub': 'Tap a service to see workers near you.', 'home.post': "Can't find someone? Post a job", 'home.join': 'Are you a worker? Join free',
    'find.where': 'District', 'find.all': 'All districts', 'find.none': 'No workers found here yet. Try another district.', 'find.new': 'New', 'find.back': 'Back',
    'hi.morning': 'Good morning', 'hi.afternoon': 'Good afternoon', 'hi.evening': 'Good evening', 'home.recent': 'Recent', 'home.search': 'Search services…', 'home.nomatch': 'No service matches. Try browsing all workers.', 'home.browse': 'Browse all workers', 'btn.call': 'Call', 'btn.whatsapp': 'WhatsApp', 'btn.profile': 'View profile', 'price.contact': 'Contact for price', 'price.from': 'From' },
  si: { 'nav.home': 'මුල් පිටුව', 'nav.workers': 'සේවකයින්', 'nav.jobs': 'රැකියා', 'nav.bookings': 'වෙන්කිරීම්', 'nav.account': 'ගිණුම', 'nav.signin': 'ඇතුල් වන්න', 'nav.create': 'ගිණුමක් සාදන්න',
    'home.title': 'ඔබට අද අවශ්‍ය කුමක්ද?', 'home.sub': 'ඔබ අසල සේවකයින් බැලීමට සේවාවක් තෝරන්න.', 'home.post': 'සොයාගත නොහැකිද? රැකියාවක් පළ කරන්න', 'home.join': 'ඔබ සේවකයෙක්ද? නොමිලේ එක්වන්න',
    'find.where': 'දිස්ත්‍රික්කය', 'find.all': 'සියලු දිස්ත්‍රික්ක', 'find.none': 'මෙහි තවම සේවකයින් නැත. වෙනත් දිස්ත්‍රික්කයක් උත්සාහ කරන්න.', 'find.new': 'අලුත්', 'find.back': 'ආපසු',
    'hi.morning': 'සුභ උදෑසනක්', 'hi.afternoon': 'සුභ දහවලක්', 'hi.evening': 'සුභ සැන්දෑවක්', 'home.recent': 'මෑතකදී', 'home.search': 'සේවා සොයන්න…', 'home.nomatch': 'ගැලපෙන සේවාවක් නැත. සියලු සේවකයින් බලන්න.', 'home.browse': 'සියලු සේවකයින් බලන්න', 'btn.call': 'අමතන්න', 'btn.whatsapp': 'WhatsApp', 'btn.profile': 'පැතිකඩ බලන්න', 'price.contact': 'මිල සඳහා අමතන්න', 'price.from': 'සිට' },
  ta: { 'nav.home': 'முகப்பு', 'nav.workers': 'பணியாளர்கள்', 'nav.jobs': 'வேலைகள்', 'nav.bookings': 'முன்பதிவுகள்', 'nav.account': 'கணக்கு', 'nav.signin': 'உள்நுழை', 'nav.create': 'கணக்கை உருவாக்கு',
    'home.title': 'இன்று உங்களுக்கு என்ன தேவை?', 'home.sub': 'அருகிலுள்ள பணியாளர்களைப் பார்க்க ஒரு சேவையைத் தொடவும்.', 'home.post': 'கிடைக்கவில்லையா? வேலையைப் பதிவிடுங்கள்', 'home.join': 'நீங்கள் பணியாளரா? இலவசமாக சேருங்கள்',
    'find.where': 'மாவட்டம்', 'find.all': 'அனைத்து மாவட்டங்கள்', 'find.none': 'இங்கு இன்னும் பணியாளர்கள் இல்லை. வேறு மாவட்டத்தை முயற்சிக்கவும்.', 'find.new': 'புதியவர்', 'find.back': 'பின்',
    'hi.morning': 'காலை வணக்கம்', 'hi.afternoon': 'மதிய வணக்கம்', 'hi.evening': 'மாலை வணக்கம்', 'home.recent': 'சமீபத்தியவை', 'home.search': 'சேவைகளைத் தேடுங்கள்…', 'home.nomatch': 'பொருந்தும் சேவை இல்லை. அனைத்து பணியாளர்களையும் காண்க.', 'home.browse': 'அனைத்து பணியாளர்களையும் காண்க', 'btn.call': 'அழைக்க', 'btn.whatsapp': 'WhatsApp', 'btn.profile': 'சுயவிவரம் பார்க்க', 'price.contact': 'விலைக்கு அழைக்கவும்', 'price.from': 'தொடக்கம்' },
}
const CATS: Record<string, [string, string]> = {
  electrical: ['විදුලි වැඩ', 'மின் வேலை'], plumbing: ['ජලනල වැඩ', 'குழாய் வேலை'], cleaning: ['පිරිසිදු කිරීම', 'சுத்தம் செய்தல்'],
  carpentry: ['වඩු වැඩ', 'தச்சு வேலை'], painting: ['තීන්ත ආලේප කිරීම', 'வண்ணம் பூசுதல்'], construction: ['ඉදිකිරීම් සහ අලුත්වැඩියා', 'கட்டுமானம் மற்றும் பழுது'],
  'appliance-repair': ['උපකරණ අලුත්වැඩියා', 'சாதனப் பழுது'], gardening: ['උද්‍යාන වැඩ', 'தோட்ட வேலை'], moving: ['ගෙනයාමට උදව්', 'இடமாற்ற உதவி'], handyman: ['සාමාන්‍ය අලුත්වැඩියා', 'பொது பழுதுபார்ப்பு'],
}
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string; catName: (slug: string, fallback: string) => string }
const I18n = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: k => k, catName: (_s, f) => f })
export const useI18n = () => useContext(I18n)

function initial(): Lang { try { const v = localStorage.getItem('wl_lang'); if (v === 'si' || v === 'ta' || v === 'en') return v } catch { /* storage blocked */ } return 'en' }
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>(initial)
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = (l: Lang) => { set(l); try { localStorage.setItem('wl_lang', l) } catch { /* ignore */ } }
  const t = (k: string) => dict[lang][k] ?? dict.en[k] ?? k
  const catName = (slug: string, fallback: string) => lang === 'en' ? fallback : (CATS[slug]?.[lang === 'si' ? 0 : 1] ?? fallback)
  return <I18n.Provider value={{ lang, setLang, t, catName }}>{children}</I18n.Provider>
}
