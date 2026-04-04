import React from 'react';
import type { CourseCategory } from '../../types';

interface CourseIconProps {
  category: CourseCategory;
  size?: number;
  className?: string;
}

// ─── PowerPoint: usa PNG oficial, fallback SVG si falla ──────────────────────
function PowerPointSVG({ size }: { size: number }) {
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/logo-powerpoint.png"
        width={size} height={size}
        alt="PowerPoint"
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block' }}
        onError={() => setImgFailed(true)}
      />
    );
  }
  // Fallback SVG si el PNG no carrega
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#ED6C47"/>
      <circle cx="20" cy="20" r="14" fill="#C43E1C" opacity="0.7"/>
      <text x="12" y="27" fontFamily="Arial Black,sans-serif" fontSize="16" fontWeight="900" fill="white">P</text>
    </svg>
  );
}

function ExcelSVG({ size }: { size: number }) {
  return (
    <img src="/logo-excel.png" width={size} height={size} alt="Excel"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

function WordSVG({ size }: { size: number }) {
  return (
    <img src="/logo-word.png" width={size} height={size} alt="Word"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

function AccessSVG({ size }: { size: number }) {
  return (
    <img src="/logo-access.png" width={size} height={size} alt="Access"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

function OutlookSVG({ size }: { size: number }) {
  return (
    <img src="/logo-outlook.png" width={size} height={size} alt="Outlook"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

function ActicSVG({ size }: { size: number }) {
  return (
    <img src="/logo-actic.png" width={size} height={size} alt="ACTIC"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

function CloudSVG({ size }: { size: number }) {
  const r = Math.round(size * 0.22);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx={r} fill="#0F172A"/>
      <rect x="4" y="4" width="15" height="15" rx="2" fill="#F25022"/>
      <rect x="21" y="4" width="15" height="15" rx="2" fill="#7FBA00"/>
      <rect x="4" y="21" width="15" height="15" rx="2" fill="#00A4EF"/>
      <rect x="21" y="21" width="15" height="15" rx="2" fill="#FFB900"/>
    </svg>
  );
}

function IASVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#6366F1"/>
      <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
      <circle cx="20" cy="12" r="2" fill="white"/>
      <circle cx="28" cy="16" r="2" fill="white"/>
      <circle cx="28" cy="24" r="2" fill="white"/>
      <circle cx="20" cy="28" r="2" fill="white"/>
      <circle cx="12" cy="24" r="2" fill="white"/>
      <circle cx="12" cy="16" r="2" fill="white"/>
      <line x1="20" y1="14" x2="20" y2="20" stroke="white" strokeWidth="1.2"/>
      <line x1="26.3" y1="17.5" x2="21.7" y2="20" stroke="white" strokeWidth="1.2"/>
      <line x1="26.3" y1="22.5" x2="21.7" y2="20" stroke="white" strokeWidth="1.2"/>
      <line x1="20" y1="26" x2="20" y2="20" stroke="white" strokeWidth="1.2"/>
      <line x1="13.7" y1="22.5" x2="18.3" y2="20" stroke="white" strokeWidth="1.2"/>
      <line x1="13.7" y1="17.5" x2="18.3" y2="20" stroke="white" strokeWidth="1.2"/>
      <circle cx="20" cy="20" r="3" fill="white"/>
    </svg>
  );
}

function RepairSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#EA580C"/>
      <path d="M28 12c0 0 2-2 4-1l-3 3 1 2-2 2-2-2-3 3c1.3 2.5 1 5.5-1 7.5-2.5 2.5-6.5 2.5-9 0-2.5-2.5-2.5-6.5 0-9 2-2 5-2.3 7.5-1l3-3-1.5-1.5 2-2 2 1 2 1z" fill="white"/>
      <circle cx="16" cy="24" r="2.5" fill="#EA580C"/>
    </svg>
  );
}

function ConsultingSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#7C3AED"/>
      <rect x="8" y="18" width="24" height="14" rx="2" fill="white" opacity="0.9"/>
      <rect x="14" y="10" width="12" height="10" rx="1" fill="white" opacity="0.7"/>
      <rect x="17" y="23" width="6" height="5" rx="1" fill="#7C3AED"/>
      <line x1="11" y1="25" x2="16" y2="25" stroke="#7C3AED" strokeWidth="1.5"/>
      <line x1="24" y1="25" x2="29" y2="25" stroke="#7C3AED" strokeWidth="1.5"/>
    </svg>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────
export function CourseIcon({ category, size = 40, className = '' }: CourseIconProps) {
  const props = { size };
  switch (category) {
    case 'excel':      return <ExcelSVG {...props} />;
    case 'word':       return <WordSVG {...props} />;
    case 'powerpoint': return <PowerPointSVG {...props} />;
    case 'access':     return <AccessSVG {...props} />;
    case 'outlook':    return <OutlookSVG {...props} />;
    case 'actic':      return <ActicSVG {...props} />;
    case 'cloud':      return <CloudSVG {...props} />;
    case 'ia':
    case 'ai':         return <IASVG {...props} />;
    case 'it_repair':  return <RepairSVG {...props} />;
    case 'consulting': return <ConsultingSVG {...props} />;
    default:           return <ConsultingSVG {...props} />;
  }
}

// ─── Gradients per categoria ──────────────────────────────────────────────────
export const categoryGradients: Record<string, string> = {
  excel:      'from-[#1a4a2e] to-[#107C41]',
  word:       'from-[#1a2d5a] to-[#2B579A]',
  powerpoint: 'from-[#7a1c0a] to-[#C43E1C]',
  access:     'from-[#4a1a1a] to-[#A4373A]',
  outlook:    'from-[#0a2a4a] to-[#0078D4]',
  cloud:      'from-[#0a0f1e] to-[#0ea5e9]',
  actic:      'from-[#4a3300] to-[#b8860b]',
  ai:         'from-[#1e1b4b] to-[#6366F1]',
  ia:         'from-[#1e1b4b] to-[#6366F1]',
  it_repair:  'from-[#3a1a08] to-[#EA580C]',
  consulting: 'from-[#2e1065] to-[#7C3AED]',
};

export const categoryBg: Record<string, string> = {
  excel:      'bg-[#107C41]/10 border-[#107C41]/30',
  word:       'bg-[#2B579A]/10 border-[#2B579A]/30',
  powerpoint: 'bg-[#C43E1C]/10 border-[#C43E1C]/30',
  access:     'bg-[#A4373A]/10 border-[#A4373A]/30',
  outlook:    'bg-[#0078D4]/10 border-[#0078D4]/30',
  cloud:      'bg-blue-500/10 border-blue-500/30',
  actic:      'bg-yellow-600/10 border-yellow-600/30',
  ai:         'bg-violet-500/10 border-violet-500/30',
  ia:         'bg-violet-500/10 border-violet-500/30',
  it_repair:  'bg-orange-500/10 border-orange-500/30',
  consulting: 'bg-purple-600/10 border-purple-600/30',
};
