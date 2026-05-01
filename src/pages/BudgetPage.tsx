import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Save, BookOpen, Euro, Clock, CheckCircle, Minus, Plus, Mail, Smartphone, CreditCard, Banknote, Building2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';
import { courseService } from '../services/courseService';
import { getSheetPrices } from '../services/sheetsService';
import { whatsappService } from '../services/whatsappService';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Course } from '../types';
import { formatCurrency } from '../utils/formatters';

function PayMethodChip({ icon, label, sub, color }: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${color}`}>
      {icon}
      <span>{label}</span>
      {sub && <span className="font-normal opacity-75 text-[10px]">{sub}</span>}
    </div>
  );
}

export function BudgetPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();
  const { cartItems, cartIds, removeFromCart, setQty, clearCart, cartCount, addToCart } = useCart();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [sheetPrices, setSheetPrices] = useState<Record<string, number>>({});

  const loadCourses = useCallback(() => {
    if (cartIds.length === 0) { setCourses([]); setLoading(false); return; }
    setLoading(true);
    courseService.getAll().then((all) => {
      const ordered = cartIds.map((id) => all.find((c) => c.id === id)).filter(Boolean) as Course[];
      setCourses(ordered);
      setLoading(false);
    });
  }, [cartIds]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // Restaura el pressupost des del núvol quan el cart és buit i l'usuari és cloud
  useEffect(() => {
    if (!session || cartIds.length > 0) return;
    const uid = authService.getSupabaseUid();
    if (!uid || !supabase) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('budgets')
          .select('items')
          .eq('status', 'draft')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!data?.items || !Array.isArray(data.items)) return;
        (data.items as Array<{ courseId?: number | string; qty?: number }>).forEach((item) => {
          const id = typeof item.courseId === 'string' ? Number(item.courseId) : item.courseId;
          if (id && !isNaN(id)) {
            addToCart(id);
            if ((item.qty ?? 1) > 1) setQty(id, item.qty!);
          }
        });
      } catch { /* ignore */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getSheetPrices().then(prices => {
      const map: Record<string, number> = {};
      prices.forEach(p => { map[p.name] = p.price; });
      setSheetPrices(map);
    }).catch(() => {});
  }, []);

  const getCoursePrice = (course: Course): number => {
    const name = course.name.toLowerCase();
    const entry = Object.entries(sheetPrices).find(([k]) =>
      k.toLowerCase().includes(name) || name.includes(k.toLowerCase())
    );
    return entry ? entry[1] : course.price;
  };

  const getQty = (id: number) => cartItems.find(i => i.id === id)?.qty ?? 1;

  // Descompte per curs individual (per la quantitat de persones d'aquell curs)
  const getDiscount = (qty: number) => qty >= 20 ? 0.15 : qty >= 10 ? 0.10 : 0;

  const getLineTotal = (course: Course) => {
    const qty = getQty(course.id!);
    const price = getCoursePrice(course);
    const disc = getDiscount(qty);
    return price * qty * (1 - disc);
  };

  const subtotal = courses.reduce((s, c) => s + getLineTotal(c), 0);
  const totalHours = courses.reduce((s, c) => s + c.duration * getQty(c.id!), 0);

  const handleRemove = (course: Course) => {
    removeFromCart(course.id!);
    showToast(`"${course.name}" eliminat del cistell`, 'info');
  };

  const buildBudgetText = () => {
    const lines = courses.map((c) => {
      const qty = getQty(c.id!);
      const price = getCoursePrice(c);
      const disc = getDiscount(qty);
      const total = getLineTotal(c);
      const discText = disc > 0 ? ` (descompte ${(disc * 100).toFixed(0)}%)` : '';
      return `  • ${c.name} — ${qty} persona${qty > 1 ? 'es' : ''} × ${formatCurrency(price)}${discText} = ${formatCurrency(total)} (${c.duration}h)`;
    }).join('\n');
    return (
      `Hola! M'interessa realitzar els cursos següents:\n\n${lines}` +
      `\n\n💰 TOTAL: ${formatCurrency(subtotal)} · ${totalHours}h de formació\n\n` +
      `Podríeu confirmar disponibilitat i properes dates? Gràcies!`
    );
  };

  const handleWhatsApp = () => {
    if (courses.length === 0) return;
    whatsappService.openChat(buildBudgetText());
    showToast('Obrint WhatsApp...', 'success');
  };

  const handleEmail = () => {
    if (courses.length === 0) return;
    const subject = encodeURIComponent('Sol·licitud de pressupost — SHformacions');
    const body = encodeURIComponent(buildBudgetText());
    window.open(`mailto:shsolucions@gmail.com?subject=${subject}&body=${body}`);
    showToast('Obrint el correu...', 'success');
  };

  const handleSave = async () => {
    if (session) {
      localStorage.setItem(`shformacions_saved_${session.userId}`, JSON.stringify(cartItems));

      // Desa al núvol si l'usuari té compte Supabase (cross-device)
      const uid = authService.getSupabaseUid();
      if (uid && supabase && courses.length > 0) {
        const items = courses.map((c) => ({
          courseId: c.id,
          name: c.name,
          price: getCoursePrice(c),
          qty: getQty(c.id!),
          discount: getDiscount(getQty(c.id!)),
        }));
        const { data: existing } = await supabase
          .from('budgets')
          .select('id')
          .eq('status', 'draft')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          await supabase.from('budgets').update({ items, total: subtotal, updated_at: new Date().toISOString() }).eq('id', existing.id);
        } else {
          await supabase.from('budgets').insert({ user_id: uid, items, total: subtotal, title: 'Pressupost', status: 'draft' });
        }
      }

      setBudgetSaved(true);
      showToast('Pressupost guardat ✓', 'success');
    } else {
      // Guardem el pressupost pendent per recuperar-lo despres del login
      localStorage.setItem('shformacions_pending_budget', JSON.stringify(cartItems));
      openAuthModal('login', () => {
        // Un cop logejat, recuperem el pressupost pendent
        const pending = localStorage.getItem('shformacions_pending_budget');
        if (pending) {
          // La sessió s'acaba de crear - l'obtenim del localStorage directament
          const sessionRaw = localStorage.getItem('shformacions_session');
          if (sessionRaw) {
            try {
              const sess = JSON.parse(sessionRaw);
              localStorage.setItem(`shformacions_saved_${sess.userId}`, pending);
              localStorage.removeItem('shformacions_pending_budget');
            } catch { /* continua */ }
          }
        }
        setBudgetSaved(true);
        showToast('Pressupost guardat al teu compte ✓', 'success');
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  if (courses.length === 0) {
    return (
      <div className="px-4 py-4 flex flex-col gap-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>El meu cistell</h1>
        <EmptyState
          icon={<ShoppingCart size={32} />}
          title="El cistell és buit"
          description="Afegeix cursos des del catàleg. No cal iniciar sessió."
          action={<Link to="/cursos"><Button size="sm" icon={<BookOpen size={15} />}>Explorar cursos</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* Capçalera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>El meu cistell</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {cartCount} {cartCount === 1 ? 'curs' : 'cursos'} · {totalHours}h total
          </p>
        </div>
        <button onClick={() => { clearCart(); showToast('Cistell buidat', 'info'); }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Buidar tot
        </button>
      </div>

      {/* Llista de cursos amb quantitat individual */}
      <div className="flex flex-col gap-3">
        {courses.map((course, i) => {
          const qty = getQty(course.id!);
          const price = getCoursePrice(course);
          const disc = getDiscount(qty);
          const lineTotal = getLineTotal(course);

          return (
            <div key={course.id}
              className="rounded-2xl border p-3 flex flex-col gap-2.5"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
              {/* Fila superior: logo + nom + eliminar */}
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-accent-500/15 text-accent-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradients[course.category] ?? 'from-gray-700 to-gray-900'}`}>
                  <CourseIcon category={course.category} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/cursos/${course.id}`}>
                    <p className="text-sm font-semibold truncate hover:text-accent-500 transition-colors"
                      style={{ color: 'var(--text-primary)' }}>{course.name}</p>
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {course.duration}h · {formatCurrency(price)} / persona
                  </p>
                </div>
                <button onClick={() => handleRemove(course)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Fila inferior: selector persones + total */}
              <div className="flex items-center justify-between pl-8">
                {/* Selector persones */}
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Persones:</span>
                  <button onClick={() => setQty(course.id!, Math.max(1, qty - 1))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:bg-accent-500/10"
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}>
                    <Minus size={11} />
                  </button>
                  <span className="text-sm font-black w-6 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {qty}
                  </span>
                  <button onClick={() => setQty(course.id!, qty + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:bg-accent-500/10"
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}>
                    <Plus size={11} />
                  </button>
                </div>

                {/* Total línia */}
                <div className="text-right">
                  {disc > 0 && (
                    <p className="text-[10px] text-green-400">🎉 -{(disc*100).toFixed(0)}% grup</p>
                  )}
                  <span className="text-sm font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              </div>

              {/* Nota descompte si aplica */}
              {qty >= 10 && (
                <div className="ml-8 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-[10px] text-green-400">
                    🎉 {qty >= 20 ? '15%' : '10%'} de descompte aplicat per grup de {qty} persones
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RESUM TOTAL */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-base)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-base)' }}>
          <Euro size={14} className="text-accent-500" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resum</span>
          {Object.keys(sheetPrices).length > 0 && (
            <span className="text-[9px] text-green-400 ml-auto">● preus en temps real</span>
          )}
        </div>
        <div className="px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-card)' }}>
          {courses.map((c) => {
            const qty = getQty(c.id!);
            const price = getCoursePrice(c);
            const disc = getDiscount(qty);
            return (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-xs truncate flex-1 mr-2" style={{ color: 'var(--text-secondary)' }}>
                  {c.name} × {qty}p{disc > 0 ? ` (-${(disc*100).toFixed(0)}%)` : ''}
                </span>
                <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(getLineTotal(c))}
                </span>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-1.5 border-t mt-1" style={{ borderColor: 'var(--border-base)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={11} /> Total hores
            </div>
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {totalHours}h
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-strong)' }}>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>TOTAL</span>
            <span className="text-2xl font-black tabular-nums text-accent-500">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* ACCIONS: WhatsApp + Email costat a costat */}
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {/* WhatsApp */}
          <button onClick={handleWhatsApp}
            className="h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-95 hover:opacity-90 text-sm"
            style={{ backgroundColor: '#25D366' }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="white" className="flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </button>

          {/* Email */}
          <button onClick={handleEmail}
            className="h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-95 hover:opacity-90 text-sm"
            style={{ backgroundColor: '#0072C6' }}>
            <Mail size={17} className="flex-shrink-0" />
            Correu
          </button>
        </div>

        {/* Mètodes de pagament acceptats */}
        <div className="rounded-2xl border px-4 py-3.5" style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--text-faint)' }}>
            Formes de pagament acceptades
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <PayMethodChip icon={<Smartphone size={13} />} label="Bizum" color="text-green-400 bg-green-500/10 border-green-500/25" />
            <PayMethodChip icon={<CreditCard size={13} />} label="Targeta" color="text-blue-400 bg-blue-500/10 border-blue-500/25" />
            <PayMethodChip
              icon={
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                </svg>
              }
              label="PayPal"
              color="text-[#009CDE] bg-[#009CDE]/10 border-[#009CDE]/25"
            />
            <PayMethodChip icon={<Building2 size={13} />} label="Transferència" color="text-purple-400 bg-purple-500/10 border-purple-500/25" />
            <PayMethodChip icon={<Banknote size={13} />} label="Efectiu" color="text-yellow-500 bg-yellow-500/10 border-yellow-500/25" />
          </div>
        </div>

        {budgetSaved ? (
          <div className="flex items-center justify-center gap-2 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-semibold">
            <CheckCircle size={16} /> Pressupost guardat
          </div>
        ) : (
          <button onClick={handleSave}
            className="w-full h-10 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-accent-500/10 active:scale-95"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}>
            <Save size={15} className="text-accent-500" />
            {session ? 'Guardar pressupost' : 'Guardar pressupost (inicia sessió)'}
          </button>
        )}

        <Link to="/cursos">
          <button className="w-full h-10 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowRight size={14} /> Afegir més cursos
          </button>
        </Link>
      </div>

      <p className="text-xs text-center pb-2" style={{ color: 'var(--text-faint)' }}>
        Confirmem disponibilitat i us contactem en menys de 24h.
      </p>
    </div>
  );
}
