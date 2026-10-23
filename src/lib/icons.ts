import { Zap, Droplets, Sparkles, Hammer, PaintRoller, HardHat, Wrench, Sprout, Truck, Briefcase, type LucideIcon } from 'lucide-react'
export const ICONS: Record<string, LucideIcon> = { zap: Zap, droplets: Droplets, sparkles: Sparkles, hammer: Hammer, 'paint-roller': PaintRoller, 'hard-hat': HardHat, wrench: Wrench, sprout: Sprout, truck: Truck }
export const iconFor = (name: string | null) => ICONS[name ?? ''] ?? Briefcase
