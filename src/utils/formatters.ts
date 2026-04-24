export function formatCurrency(amount: number, locale = 'ca-ES'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
}
export function formatHours(hours: number): string { return `${hours}h`; }
export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength - 3) + '...';
}
export function capitalize(text: string): string {
  return !text ? '' : text.charAt(0).toUpperCase() + text.slice(1);
}
export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}
export function isValidPin(pin: string): boolean { return typeof pin === 'string' && pin.length >= 6 && pin.length <= 64; }
export function isValidEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// Brand colors per category (for backgrounds, badges, logos)
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; hex: string; light: string }> = {
  excel:      { bg: 'bg-emerald-500/15',  text: 'text-emerald-400',  border: 'border-emerald-500/30',  hex: '#107C41', light: '#d1fae5' },
  word:       { bg: 'bg-blue-600/15',     text: 'text-blue-400',     border: 'border-blue-500/30',     hex: '#2B579A', light: '#dbeafe' },
  access:     { bg: 'bg-red-500/15',      text: 'text-red-400',      border: 'border-red-500/30',      hex: '#A4373A', light: '#fee2e2' },
  outlook:    { bg: 'bg-sky-500/15',      text: 'text-sky-400',      border: 'border-sky-500/30',      hex: '#0078D4', light: '#e0f2fe' },
  cloud:      { bg: 'bg-cyan-500/15',     text: 'text-cyan-400',     border: 'border-cyan-500/30',     hex: '#00A4EF', light: '#cffafe' },
  ia:         { bg: 'bg-violet-500/15',   text: 'text-violet-400',   border: 'border-violet-500/30',   hex: '#7C3AED', light: '#ede9fe' },
  actic:      { bg: 'bg-rose-600/15',     text: 'text-rose-400',     border: 'border-rose-500/30',     hex: '#DA121A', light: '#ffe4e6' },
  it_repair:  { bg: 'bg-amber-500/15',    text: 'text-amber-400',    border: 'border-amber-500/30',    hex: '#F59E0B', light: '#fef3c7' },
  consulting: { bg: 'bg-purple-500/15',   text: 'text-purple-400',   border: 'border-purple-500/30',   hex: '#8B5CF6', light: '#ede9fe' },
};

export function getCategoryColor(category: string): string {
  const c = CATEGORY_COLORS[category];
  return c ? `${c.bg} ${c.text} ${c.border}` : 'bg-gray-500/15 text-gray-400 border-gray-500/30';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active:    'bg-green-500/15 text-green-400 border-green-500/30',
    inactive:  'bg-gray-500/15 text-gray-500 border-gray-500/30',
    full:      'bg-red-500/15 text-red-400 border-red-500/30',
    draft:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    approved:  'bg-green-500/15 text-green-400 border-green-500/30',
    rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
    completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    paid:      'bg-green-500/15 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return colors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
}
