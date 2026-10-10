import {
  Briefcase, Heart, Activity, BookOpen, ShoppingBag, Palette, Circle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category } from '../types';

const ICONS: Record<Category, LucideIcon> = {
  work: Briefcase,
  personal: Heart,
  health: Activity,
  learning: BookOpen,
  errands: ShoppingBag,
  creative: Palette,
  other: Circle,
};

export function CategoryIcon({ category, size = 16, className = '' }: { category: Category; size?: number; className?: string }) {
  const Icon = ICONS[category] ?? Circle;
  return <Icon size={size} className={className} strokeWidth={2} />;
}
