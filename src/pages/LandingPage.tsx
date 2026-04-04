import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, BookOpen, Users, Award, Zap, Clock, Star } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { courseService } from '../services/courseService';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import { Button } from '../components/ui/Button';
import type { Course, CourseCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

const CATEGORIES: { key: CourseCategory; emoji: string }[] = [
  { key: 'excel',      emoji: '📊' },
  { key: 'word',       emoji: '📄' },
  { key: 'access',     emoji: '🗃️' },
  { key: 'outlook',    emoji: '📧' },
  { key: 'cloud',      emoji: '☁️' },
  { key: 'ai',         emoji: '🤖' },
  { key: 'actic',      emoji: '🏅' },
  { key: 'it_repair',  emoji: '🔧' },
  { key: 'consulting', emoji: '💼' },
];

export function LandingPage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getAll().then((all) => {
      // Pick 1 per category for showcase
      const seen = new Set<CourseCategory>();
      const picks: Course[] = [];
      for (const c of all) {
        if (!seen.has(c.category) && c.status === 'active') {
          seen.add(c.category);
          picks.push(c);
        }
        if (picks.length >= 6) break;
      }
      setFeatured(picks);
    });
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pt-10 pb-14 text-center">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-48 h-48 bg-violet-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          {/* Tagline badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-medium mb-5">
            <Zap size={12} className="fill-accent-400" />
            Formació professional en IT · Girona
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white font-display leading-tight mb-4">
            Aprèn les eines
            <span className="bg-gradient-to-r from-accent-400 to-violet-400 bg-clip-text text-transparent block">
              del futur digital
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            Cursos presencials i en línia d'ofimàtica, núvol, intel·ligència artificial i preparació ACTIC. Per a persones i empreses.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cursos">
              <Button size="md" iconRight={<ArrowRight size={18} />}>
                Veure tots els cursos
              </Button>
            </Link>
            <Link to="/cursos?cat=actic">
              <Button size="md" variant="secondary">
                Preparació ACTIC
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
            {[
              { icon: <BookOpen size={18} />, value: '18+', label: 'Cursos' },
              { icon: <Users size={18} />, value: '100%', label: 'Personalitzat' },
              { icon: <Award size={18} />, value: '3', label: 'Nivells ACTIC' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/3 border border-white/5">
                <span className="text-accent-400">{s.icon}</span>
                <span className="text-xl font-black text-white font-display">{s.value}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="px-4 pb-10">
        <h2 className="text-xl font-bold text-white font-display mb-5 px-1">Àrees de formació</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {CATEGORIES.map(({ key, emoji }) => (
            <Link
              key={key}
              to={`/cursos?cat=${key}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br ${categoryGradients[key]} bg-opacity-10 border border-white/5 hover:border-white/20 hover:scale-105 transition-all duration-200 group`}
            >
              <div className={`p-2 rounded-xl bg-gradient-to-br ${categoryGradients[key]} shadow-lg`}>
                <CourseIcon category={key} size={28} />
              </div>
              <span className="text-xs font-medium text-white text-center leading-tight">
                {t(`cat.${key}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED COURSES ──────────────────────────────── */}
      {featured.length > 0 && (
        <section className="px-4 pb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white font-display">Cursos destacats</h2>
            <Link to="/cursos" className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1">
              Tots <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featured.slice(0, 4).map((course) => (
              <FeaturedCourseCard key={course.id} course={course} t={t} />
            ))}
          </div>
        </section>
      )}

      {/* ── WHY US ───────────────────────────────────────── */}
      <section className="px-4 pb-10">
        <div className="rounded-3xl bg-gradient-to-br from-accent-500/10 to-violet-500/5 border border-accent-500/20 p-6">
          <h2 className="text-xl font-bold text-white font-display mb-5">Per què SHformacions?</h2>
          <div className="flex flex-col gap-3">
            {[
              'Classes reduïdes i atenció personalitzada',
              'Instructor expert amb experiència real en empreses',
              'Material didàctic actualitzat a 2025',
              'Certificat de participació per cada curs',
              'Preparació oficial per a l\'examen ACTIC',
              'Modalitats presencial, online i híbrida',
              'Horaris flexibles adaptats als professionals',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-accent-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/cursos">
              <Button fullWidth iconRight={<ArrowRight size={16} />}>
                Consultar cursos i preus
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI PROMO BANNER ──────────────────────────────── */}
      <section className="px-4 pb-12">
        <div className="rounded-3xl bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-500/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium mb-3">
              🤖 Nou 2025
            </div>
            <h3 className="text-lg font-bold text-white font-display mb-2">
              Intel·ligència Artificial per a professionals
            </h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Aprèn a treballar amb ChatGPT, Claude, Midjourney i eines d'automatització. Cursos adaptats a cada departament empresarial.
            </p>
            <Link to="/cursos?cat=ai">
              <Button variant="outline" size="sm" iconRight={<ArrowRight size={14} />}>
                Descobrir cursos IA
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedCourseCard({ course, t }: { course: Course; t: (k: string) => string }) {
  const seatsLeft = course.maxStudents - course.currentStudents;

  return (
    <Link to={`/cursos/${course.id}`}>
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#141414] transition-all duration-200 group">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryGradients[course.category]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <CourseIcon category={course.category} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate leading-snug">{course.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={10} />{course.duration}h
            </span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-sm font-bold text-accent-400">
              {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
            </span>
          </div>
        </div>
        <ArrowRight size={15} className="text-gray-600 group-hover:text-accent-400 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}
