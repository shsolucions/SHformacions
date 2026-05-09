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
    <img src="/logo-ia.png" width={size} height={size} alt="IA"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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

function InformaticaSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#0369a1"/>
      {/* Pantalla portàtil */}
      <rect x="7" y="8" width="26" height="17" rx="2" fill="white" opacity="0.95"/>
      <rect x="9" y="10" width="22" height="13" rx="1" fill="#0369a1" opacity="0.85"/>
      {/* Llum d'activitat */}
      <circle cx="20" cy="16.5" r="3.5" fill="#38bdf8" opacity="0.9"/>
      <circle cx="20" cy="16.5" r="1.5" fill="white"/>
      {/* Base portàtil */}
      <path d="M5 27h30l-2 5H7z" fill="white" opacity="0.9"/>
      {/* Xarnera */}
      <rect x="7" y="25" width="26" height="2" rx="1" fill="white" opacity="0.6"/>
    </svg>
  );
}

function AssessoriaSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#b45309"/>
      {/* Cap persona */}
      <circle cx="20" cy="13" r="5" fill="white" opacity="0.95"/>
      {/* Cos */}
      <path d="M11 31c0-5 4-8 9-8s9 3 9 8" fill="white" opacity="0.85"/>
      {/* Check badge */}
      <circle cx="29" cy="13" r="6" fill="#fbbf24"/>
      <path d="M26 13l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ServeisServeisTecnicsSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#0f766e"/>
      {/* Clau anglesa */}
      <path d="M26 8c-3.3 0-6 2.7-6 6 0 .8.2 1.6.5 2.3L9 27.8c-.8.8-.8 2 0 2.8l.5.5c.8.8 2 .8 2.8 0L23.7 19.5c.7.3 1.5.5 2.3.5 3.3 0 6-2.7 6-6 0-.8-.2-1.6-.5-2.3l-3.3 3.3-2.4-.6-.6-2.4 3.3-3.3C28 8.4 27.1 8 26 8z" fill="white" opacity="0.95"/>
      {/* Pantalla TV petita */}
      <rect x="8" y="8" width="12" height="9" rx="1.5" fill="white" opacity="0.25"/>
    </svg>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────
export function CourseIcon({ category, size = 40, className = '' }: CourseIconProps) {
  const props = { size };
  switch (category) {
    case 'excel':           return <ExcelSVG {...props} />;
    case 'word':            return <WordSVG {...props} />;
    case 'powerpoint':      return <PowerPointSVG {...props} />;
    case 'access':          return <AccessSVG {...props} />;
    case 'outlook':         return <OutlookSVG {...props} />;
    case 'actic':           return <ActicSVG {...props} />;
    case 'cloud':           return <CloudSVG {...props} />;
    case 'ia':
    case 'ai':              return <IASVG {...props} />;
    case 'it_repair':       return <RepairSVG {...props} />;
    case 'consulting':      return <ConsultingSVG {...props} />;
    case 'informatica':     return <InformaticaSVG {...props} />;
    case 'assessoria':      return <AssessoriaSVG {...props} />;
    case 'serveis_tecnics': return <ServeisServeisTecnicsSVG {...props} />;
    default:                return <ConsultingSVG {...props} />;
  }
}

// ─── Colors de fons per logos PNG (funcionen en mode clar I fosc) ───────────
export const pngBgColors: Record<string, string> = {
  excel:      '#e8f5e9',   // verd molt clar
  word:       '#e3f2fd',   // blau molt clar
  powerpoint: '#fce4ec',   // vermell molt clar
  access:     '#fce4ec',   // vermell molt clar
  outlook:    '#e3f2fd',   // blau molt clar
  actic:      '#fff8e1',   // groc molt clar
};

// ─── Gradients per categoria ──────────────────────────────────────────────────
export const categoryGradients: Record<string, string> = {
  excel:           'from-[#1a4a2e] to-[#107C41]',
  word:            'from-[#1a2d5a] to-[#2B579A]',
  powerpoint:      'from-[#7a1c0a] to-[#C43E1C]',
  access:          'from-[#4a1a1a] to-[#A4373A]',
  outlook:         'from-[#0a2a4a] to-[#0078D4]',
  cloud:           'from-[#0a0f1e] to-[#0ea5e9]',
  actic:           'from-[#4a3300] to-[#b8860b]',
  ai:              'from-[#1e1b4b] to-[#6366F1]',
  ia:              'from-[#1e1b4b] to-[#6366F1]',
  it_repair:       'from-[#3a1a08] to-[#EA580C]',
  consulting:      'from-[#2e1065] to-[#7C3AED]',
  informatica:     'from-[#0c2a3a] to-[#0369a1]',
  assessoria:      'from-[#3a1f00] to-[#b45309]',
  serveis_tecnics: 'from-[#052e2b] to-[#0f766e]',
};

export const categoryBg: Record<string, string> = {
  excel:           'bg-[#107C41]/10 border-[#107C41]/30',
  word:            'bg-[#2B579A]/10 border-[#2B579A]/30',
  powerpoint:      'bg-[#C43E1C]/10 border-[#C43E1C]/30',
  access:          'bg-[#A4373A]/10 border-[#A4373A]/30',
  outlook:         'bg-[#0078D4]/10 border-[#0078D4]/30',
  cloud:           'bg-blue-500/10 border-blue-500/30',
  actic:           'bg-yellow-600/10 border-yellow-600/30',
  ai:              'bg-violet-500/10 border-violet-500/30',
  ia:              'bg-violet-500/10 border-violet-500/30',
  it_repair:       'bg-orange-500/10 border-orange-500/30',
  consulting:      'bg-purple-600/10 border-purple-600/30',
  informatica:     'bg-sky-700/10 border-sky-700/30',
  assessoria:      'bg-amber-700/10 border-amber-700/30',
  serveis_tecnics: 'bg-teal-700/10 border-teal-700/30',
};
