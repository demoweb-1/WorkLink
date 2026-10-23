// Accepts 0771234567 or +94771234567 (spaces/dashes ok). Returns +94XXXXXXXXX or null.
export function normalizePhone(input: string): string | null {
  const d = input.replace(/[\s-]/g, '')
  const n = /^0\d{9}$/.test(d) ? '+94' + d.slice(1) : d
  return /^\+94\d{9}$/.test(n) ? n : null
}
