export const BRAND = 'WorkLink' // change the product name here
// The long flow (post a job, compare offers, bookings) is switched off for customers to keep things to 2-4 taps.
// Set to true to bring the Jobs and Bookings tabs and routes back.
export const ADVANCED_JOBS = false
export const DISTRICTS = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya']
export const lkr = (n: number) => 'Rs. ' + n.toLocaleString('en-LK')
const UNIT: Record<string, string> = { hourly: ' per hour', daily: ' per day', fixed: ' fixed' }
export function priceText(price: number | null, type: string) {
  if (price == null || type === 'contact') return 'Contact for price'
  return `From ${lkr(Number(price))}${UNIT[type] ?? ''}`
}
export type Cat = { id: string; name: string; slug: string; icon_name: string | null }
export type Listing = {
  id: string; worker_id: string; service_title: string; description: string | null
  indicative_price: number | null; price_type: string; service_areas: string[]; years_experience: number | null
  profiles: { display_name: string; district: string | null } | null
  service_categories: { name: string; slug: string; icon_name: string | null } | null
}
export const LISTING_SELECT = 'id,worker_id,service_title,description,indicative_price,price_type,service_areas,years_experience,profiles!inner(display_name,district),service_categories!inner(name,slug,icon_name)'
