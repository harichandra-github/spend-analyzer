import {
  Car,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Moon,
  Receipt,
  Shapes,
  ShoppingBag,
  Sun,
  Tag,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Theme } from '../lib/theme';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  bills: Receipt,
  entertainment: Clapperboard,
  healthcare: HeartPulse,
  education: GraduationCap,
  other: Shapes,
  __overall: Wallet,
};

export function CategoryIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = CATEGORY_ICONS[id] ?? Tag;
  return (
    <span className="cat-avatar" aria-hidden>
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button className="icon-btn" onClick={onToggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden>
        <Icon size={22} />
      </span>
      <p className="empty-title">{title}</p>
      {children && <p className="muted small">{children}</p>}
    </div>
  );
}
