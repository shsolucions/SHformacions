import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Send, ArrowRight, Save, BookOpen, Euro, Clock, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';
import { courseService } from '../services/courseService';
import { whatsappService } from '../services/whatsappService';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Course } from '../types';
import { formatCurrency } from '../utils/formatters';

export function BudgetPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { cartIds, removeFromCart, clearCart, cartCount } = useCart();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetSaved, setBudgetSaved] = useState(false);

  const loadCourses = useCallback(() => {
    if (cartIds.length === 0) { setCourses([]); setLoading(false); return; }
    setLoading(true);
    courseService.getAll().then((all) => {
      const ordered = cartIds
        .map((id) => all.find((c) => c.id === id))
        .filter(Boolean) as Course[];
      setCourses(ordered);
      setLoading(false);
    });
  }, [cartIds]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // Càlculs
  const subtotal   = courses.reduce((s, c) => s + c.price, 0);
  const totalHours = courses.reduce((s, c) => s + c.duration, 0);

  const handleRemove = (course: Course) => {
    removeFromCart(course.id!);
    showToast(`"${course.name}" eliminat del cistell`, 'info');
  };

  // Enviar per WhatsApp (sense login)
  const handleWhatsApp = () => {
    if (courses.length === 0) return;
    const lines = courses.map((c) =>
      `  • ${c.name} — ${c.price === 0 ? 'Gratuït' : formatCurrency(c.price)} (${c.duration}h)`
    ).join('\n');
    const msg =
      `Hola! M'interessa realitzar els cursos següents:\n\n${lines}` +
      `\n\nTOTAL: ${formatCurrency(subtotal)} · ${totalHours}h de formació\n\n` +
      `Podríeu confirmar disponibilitat i properes dates? Gràcies!`;
    whatsappService.openChat(msg);
    showToast('Pressupost enviat per WhatsApp!', 'success');
  };

  // Guardar pressupost (demana login si no hi és)
  const handleSave = () => {
    if (session) {
      // Ja té sessió → guardem localment amb el seu userId
      const key = `shformacions_saved_${session.userId}`;
      localStorage.setItem(key, JSON.stringify(cartIds));
      setBudgetSaved(true);
      showToast('Pressupost guardat al teu compte ✓', 'success');
    } else {
      // Sense sessió → obrim modal login, quan entra es guarda
      openAuthModal('login', () => {
        setBudgetSaved(true);
        showToast('Sessió iniciada. Pressupost guardat ✓', 'success');
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  // ── Cistell buit ─────────────────────────────────────────
  if (courses.length === 0) {
    return (
      <div className="px-4 py-4 flex flex-col gap-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          El meu cistell
        </h1>
        <EmptyState
          icon={<ShoppingCart size={32} />}
          title="El cistell és buit"
          description="Afegeix cursos des del catàleg. No cal iniciar sessió."
          action={
            <Link to="/cursos">
              <Button size="sm" icon={<BookOpen size={15} />}>Explorar cursos</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── Cistell amb cursos ────────────────────────────────────
  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* Capçalera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            El meu cistell
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {cartCount} {cartCount === 1 ? 'curs' : 'cursos'} · {totalHours}h total
          </p>
        </div>
        <button
          onClick={() => { clearCart(); showToast('Cistell buidat', 'info'); }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Buidar tot
        </button>
      </div>

      {/* Llista de cursos */}
      <div className="flex flex-col gap-2">
        {courses.map((course, i) => (
          <div key={course.id}
            className="flex items-center gap-3 rounded-2xl p-3 border transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
            {/* Número */}
            <span className="w-5 h-5 rounded-full bg-accent-500/15 text-accent-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            {/* Logo */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryGradients[course.category] ?? 'from-gray-700 to-gray-900'} flex items-center justify-center flex-shrink-0`}>
              <CourseIcon category={course.category} size={24} />
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <Link to={`/cursos/${course.id}`}>
                <p className="text-sm font-semibold truncate hover:text-accent-500 transition-colors"
                  style={{ color: 'var(--text-primary)' }}>
                  {course.name}
                </p>
              </Link>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {course.duration}h · {t(`courses.level_${course.level}`)}
              </p>
            </div>
            {/* Preu + eliminar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
              </span>
              <button onClick={() => handleRemove(course)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                title="Eliminar">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── RESUM TOTAL ─────────────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-base)' }}>
        {/* Capçalera */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-base)' }}>
          <Euro size={14} className="text-accent-500" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resum</span>
        </div>
        {/* Detall */}
        <div className="px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-card)' }}>
          {courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <span className="text-xs truncate flex-1 mr-2" style={{ color: 'var(--text-secondary)' }}>
                {c.name}
              </span>
              <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                {c.price === 0 ? 'Gratuït' : formatCurrency(c.price)}
              </span>
            </div>
          ))}
          {/* Hores */}
          <div className="flex items-center justify-between pt-1.5 border-t mt-1"
            style={{ borderColor: 'var(--border-base)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={11} /> Hores de formació
            </div>
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {totalHours}h
            </span>
          </div>
          {/* TOTAL */}
          <div className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: 'var(--border-strong)' }}>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>TOTAL</span>
            <span className="text-2xl font-black tabular-nums text-accent-500">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* ── ACCIONS ──────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">

        {/* Botó WhatsApp — sempre disponible, sense login */}
        <button onClick={handleWhatsApp}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Enviar pressupost per WhatsApp
        </button>

        {/* Botó Guardar — demana login si cal */}
        {budgetSaved ? (
          <div className="flex items-center justify-center gap-2 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-semibold">
            <CheckCircle size={16} /> Pressupost guardat al teu compte
          </div>
        ) : (
          <button onClick={handleSave}
            className="w-full h-10 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-accent-500/10 active:scale-95"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}>
            <Save size={15} className="text-accent-500" />
            {session ? 'Guardar pressupost' : 'Guardar pressupost (inicia sessió)'}
          </button>
        )}

        {/* Afegir més cursos */}
        <Link to="/cursos">
          <button className="w-full h-10 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowRight size={14} /> Afegir més cursos
          </button>
        </Link>
      </div>

      {/* Nota */}
      <p className="text-xs text-center pb-2" style={{ color: 'var(--text-faint)' }}>
        El pressupost s'envia via WhatsApp. Confirmem disponibilitat en 24h.
      </p>
    </div>
  );
}
