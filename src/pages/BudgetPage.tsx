import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Send, ArrowRight, LogIn, Plus, Check, Euro } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { courseService } from '../services/courseService';
import { whatsappService } from '../services/whatsappService';
import { useSavedCourses } from '../hooks/useSavedCourses';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Course } from '../types';
import { formatCurrency } from '../utils/formatters';

// ── Percentatge IVA (sense IVA per defecte; es pot canviar a 21) ─────
const IVA_PERCENT = 0; // 0 = sense IVA, 21 = amb IVA 21%

export function BudgetPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { savedIds, remove, clearAll } = useSavedCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(() => {
    if (savedIds.length === 0) { setCourses([]); setLoading(false); return; }
    courseService.getAll().then((all) => {
      // Mantenim l'ordre en que s'han afegit
      const ordered = savedIds
        .map((id) => all.find((c) => c.id === id))
        .filter(Boolean) as Course[];
      setCourses(ordered);
      setLoading(false);
    });
  }, [savedIds]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // ── Càlculs ────────────────────────────────────────────────────────
  const subtotal     = courses.reduce((s, c) => s + c.price, 0);
  const ivaAmount    = IVA_PERCENT > 0 ? subtotal * (IVA_PERCENT / 100) : 0;
  const total        = subtotal + ivaAmount;
  const totalHours   = courses.reduce((s, c) => s + c.duration, 0);

  const handleSendWhatsApp = () => {
    if (courses.length === 0) return;
    const lines = courses.map((c) =>
      `  • ${c.name} — ${formatCurrency(c.price)} (${c.duration}h)`
    ).join('\n');
    const ivaLine = IVA_PERCENT > 0 ? `\nIVA (${IVA_PERCENT}%): ${formatCurrency(ivaAmount)}` : '';
    const msg =
      `Hola! M'interessa realitzar els cursos següents:\n\n${lines}` +
      `\n\nSubtotal: ${formatCurrency(subtotal)}${ivaLine}` +
      `\nTOTAL: ${formatCurrency(total)} (${totalHours}h de formació)\n\n` +
      `Podríeu confirmar disponibilitat i properes dates? Gràcies!`;
    whatsappService.openChat(msg);
    showToast('Pressupost enviat per WhatsApp! ✅', 'success');
  };

  const handleRemove = (courseId: number, courseName: string) => {
    remove(courseId);
    showToast(`"${courseName}" eliminat del pressupost`, 'info');
  };

  // ── Sense sessió ──────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-accent-500/10 flex items-center justify-center">
          <ShoppingCart size={36} className="text-accent-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
            {t('budget.title')}
          </h1>
          <p className="text-sm mt-2 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
            Inicia sessió per guardar els cursos que t'interessen i enviar el pressupost personalitzat.
          </p>
        </div>
        <div className="flex gap-3">
          <Button icon={<LogIn size={15} />} onClick={() => navigate('/login')}>
            {t('auth.login')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/cursos')}>
            Veure cursos
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  // ── Pressupost buit ────────────────────────────────────────────────
  if (courses.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
          {t('budget.title')}
        </h1>
        <EmptyState
          icon={<ShoppingCart size={32} />}
          title={t('budget.empty')}
          description="Afegeix cursos des del catàleg prement el botó «Afegir al pressupost» a cada curs."
          action={
            <Link to="/cursos">
              <Button size="sm" icon={<Plus size={15} />}>
                Explorar cursos
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── Pressupost amb cursos ──────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Capçalera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
            {t('budget.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {courses.length} {courses.length === 1 ? 'curs seleccionat' : 'cursos seleccionats'} · {totalHours}h
          </p>
        </div>
        <button
          onClick={() => { clearAll(); showToast('Pressupost buidat', 'info'); }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
        >
          Buidar tot
        </button>
      </div>

      {/* Llista de cursos seleccionats */}
      <div className="flex flex-col gap-2.5">
        {courses.map((course, i) => (
          <div
            key={course.id}
            className="flex items-center gap-3 rounded-2xl p-3.5 border transition-all"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}
          >
            {/* Número */}
            <div className="w-6 h-6 rounded-full bg-accent-500/15 text-accent-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>

            {/* Logo */}
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryGradients[course.category] ?? 'from-gray-700 to-gray-900'} flex items-center justify-center flex-shrink-0`}
            >
              <CourseIcon category={course.category} size={26} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <Link to={`/cursos/${course.id}`}>
                <p className="text-sm font-semibold truncate hover:text-accent-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {course.name}
                </p>
              </Link>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {course.duration}h · {t(`courses.level_${course.level}`)} · {t(`courses.format_${course.format}`)}
              </p>
            </div>

            {/* Preu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-base font-black tabular-nums font-display"
                style={{ color: 'var(--text-primary)' }}
              >
                {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
              </span>
              <button
                onClick={() => handleRemove(course.id!, course.name)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-red-400 hover:bg-red-500/10"
                title="Eliminar del pressupost"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── RESUM ECONÒMIC ────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border-base)' }}
      >
        {/* Capçalera del resum */}
        <div
          className="px-4 py-3 flex items-center gap-2 border-b"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-base)' }}
        >
          <Euro size={15} className="text-accent-500" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Resum del pressupost
          </span>
        </div>

        <div className="p-4 flex flex-col gap-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Detall per curs */}
          {courses.map((course) => (
            <div key={course.id} className="flex items-center justify-between">
              <span className="text-xs truncate flex-1 mr-2" style={{ color: 'var(--text-secondary)' }}>
                {course.name}
              </span>
              <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
              </span>
            </div>
          ))}

          {/* Separador */}
          <div className="border-t pt-2.5 mt-1 flex flex-col gap-1.5" style={{ borderColor: 'var(--border-base)' }}>

            {/* Subtotal */}
            {IVA_PERCENT > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
            )}

            {/* IVA si cal */}
            {IVA_PERCENT > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>IVA ({IVA_PERCENT}%)</span>
                <span className="text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(ivaAmount)}
                </span>
              </div>
            )}

            {/* Hores totals */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hores de formació</span>
              <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {totalHours}h
              </span>
            </div>

            {/* TOTAL GRAN */}
            <div
              className="flex items-center justify-between mt-1 pt-2.5 border-t"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                TOTAL
              </span>
              <span className="text-2xl font-black tabular-nums text-accent-500 font-display">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACCIONS ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Enviar per WhatsApp */}
        <button
          onClick={handleSendWhatsApp}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Enviar pressupost per WhatsApp
        </button>

        {/* Continuar afegint cursos */}
        <Link to="/cursos">
          <Button variant="secondary" fullWidth icon={<Plus size={15} />}>
            Afegir més cursos
          </Button>
        </Link>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
        El pressupost s'envia via WhatsApp. Confirmarem disponibilitat i dates en 24h.
      </p>
    </div>
  );
}
