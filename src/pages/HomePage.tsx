import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Award, Zap, BookOpen } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { courseService } from '../services/courseService';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import type { Course, CourseCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_GROUPS: CourseCategory[] = [
  'excel', 'word', 'powerpoint', 'access', 'outlook',
  'cloud', 'ia', 'actic', 'consulting',
];

const WHY_ITEMS = [
  { icon: <Star size={18} className="text-yellow-400" />, title: 'Instructor expert', desc: "+15 anys d'experiència en formació IT i empreses" },
  { icon: <Users size={18} className="text-blue-400" />, title: 'Grups reduïts', desc: 'Màxim 12 alumnes per curs' },
  { icon: <Award size={18} className="text-green-400" />, title: 'Certificats oficials', desc: 'Preparació ACTIC i Microsoft' },
  { icon: <Zap size={18} className="text-purple-400" />, title: 'Pràctic al 100%', desc: 'Exercicis reals del dia a dia laboral' },
];

export function HomePage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [featured, setFeatured] = useState<Course[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    courseService.getAll().then((all) => {
      setFeatured(all.filter((c) => c.status === 'active' && c.category !== 'it_repair').slice(0, 4));
      const c: Record<string, number> = {};
      all.forEach((course) => { c[course.category] = (c[course.category] || 0) + 1; });
      setCounts(c);
    });
  }, []);

  return (
    <div className="flex flex-col gap-7 -mt-2">

      {/* ── HERO ─────────────────────────────────────────────────
          Fons sempre fosc (gradient fix) però el text SEMPRE BLANC
          per assegurar visibilitat independentment del tema
      ──────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden p-5 pt-6"
        style={{ background: 'linear-gradient(135deg, #0d1628 0%, #1a2540 50%, #0d1628 100%)' }}>
        {/* Glow blau */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(14,165,233,0.12)' }} />

        <div className="relative">
          <div className="flex items-start gap-3">
            <img src="/robot-icon.png" alt="SHformacions"
              className="w-14 h-14 rounded-2xl object-cover shadow-xl flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-accent-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                SH Solucions
              </p>
              {/* Text SEMPRE blanc (fons sempre fosc al hero) */}
              <h1 className="text-xl font-black font-display leading-tight" style={{ color: "#ffffff" }}>
                {t('home.hero_title')}
              </h1>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {t('home.hero_sub')}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 mt-5">
            <Link to="/cursos"
              className="flex-1 h-10 bg-accent-500 hover:bg-accent-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors">
              <BookOpen size={15} />{t('home.browse_courses')}
            </Link>
            <a href={`https://wa.me/34660137163?text=${encodeURIComponent(t('whatsapp.message'))}`}
              target="_blank" rel="noopener noreferrer"
              className="h-10 px-4 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors flex-shrink-0"
              style={{ background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.4)', color: '#25D366' }}>
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>
          {t('courses.title')}
        </h2>
        {/* Grid de 5 columnes per ficar els 10 en 2 files */}
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_GROUPS.map((key) => {
            const grad = categoryGradients[key] ?? 'from-gray-700 to-gray-900';
            return (
              <Link key={key} to={`/cursos?cat=${key}`}
                className={`bg-gradient-to-br ${grad} rounded-2xl p-2.5 flex flex-col items-center gap-1.5 hover:scale-[1.04] active:scale-95 transition-all`}
                style={{ border: '1px solid rgba(255,255,255,0.1)', minHeight: 80 }}>
                <CourseIcon category={key} size={26} />
                <p className="text-[9px] font-semibold text-center leading-tight drop-shadow" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                  {t(`cat.${key}`)}
                </p>
                {counts[key] !== undefined && (
                  <p className="text-[8px] leading-none" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {counts[key]} {counts[key] === 1 ? 'curs' : 'cursos'}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── CURSOS DESTACATS ─────────────────────────────────────── */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              Cursos destacats
            </h2>
            <Link to="/cursos"
              className="text-accent-500 text-sm flex items-center gap-1 hover:text-accent-400 transition-colors">
              {t('common.view_all')} <ArrowRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {featured.map((course) => (
              <FeaturedCourseCard key={course.id} course={course} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── PER QUÈ TRIAR-NOS ────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>
          {t('home.why_title')}
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {WHY_ITEMS.map((item, i) => (
            <div key={i} className="rounded-2xl p-4 border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5"
                style={{ backgroundColor: 'var(--bg-muted)' }}>
                {item.icon}
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function FeaturedCourseCard({ course, t }: { course: Course; t: (k: string) => string }) {
  const grad = categoryGradients[course.category] ?? 'from-gray-700 to-gray-900';
  return (
    <Link to={`/cursos/${course.id}`}
      className={`flex items-center gap-3 bg-gradient-to-r ${grad} rounded-2xl p-3.5 hover:opacity-95 transition-all`}
      style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
        <CourseIcon category={course.category} size={36} />
      </div>
      <div className="min-w-0 flex-1">
        {/* Sempre blanc perquè sempre va sobre gradient fosc */}
        <p className="text-sm font-semibold text-white truncate">{course.name}</p>
        <p className="text-xs text-white/55 mt-0.5">{course.duration}h · {t(`courses.level_${course.level}`)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-black text-white tabular-nums">
          {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
        </span>
        <ArrowRight size={14} className="text-white/50" />
      </div>
    </Link>
  );
}
