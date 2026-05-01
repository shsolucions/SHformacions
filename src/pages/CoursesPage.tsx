import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Clock, Users, ChevronDown, Plus, ShoppingCart, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { courseService } from '../services/courseService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CourseFormModal } from '../components/courses/CourseFormModal';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import { useSheetPrices } from '../hooks/useSheetPrices';
import type { Course, CourseCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all',        label: 'cat.all' },
  { key: 'excel',      label: 'cat.excel' },
  { key: 'word',       label: 'cat.word' },
  { key: 'powerpoint', label: 'cat.powerpoint' },
  { key: 'access',     label: 'cat.access' },
  { key: 'outlook',    label: 'cat.outlook' },
  { key: 'cloud',      label: 'cat.cloud' },
  { key: 'ia',         label: 'cat.ia' },
  { key: 'actic',      label: 'cat.actic' },
  { key: 'consulting', label: 'cat.consulting' },
];

const LEVEL_COLORS: Record<string, string> = {
  basic:        'text-green-500 bg-green-500/10 border-green-500/20',
  intermediate: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  advanced:     'text-red-500 bg-red-500/10 border-red-500/20',
};

const FORMAT_COLORS: Record<string, string> = {
  online:     'text-blue-400 bg-blue-500/10 border-blue-500/20',
  presential: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  hybrid:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

export function CoursesPage() {
  const { isAdmin } = useAuth();
  const { inCart, toggleCart } = useCart();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(searchParams.get('cat') ?? 'all');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const load = async () => {
    const all = await courseService.getAll();
    setCourses(all.filter(c => c.category !== 'it_repair' || isAdmin));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setCatFilter(cat);
  }, [searchParams]);

  const filtered = useMemo(() =>
    courses.filter((c) => {
      const matchCat = catFilter === 'all' || c.category === catFilter;
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }), [courses, search, catFilter]);

  const grouped = useMemo(() => {
    if (catFilter !== 'all' || search) return null;
    const map: Record<string, Course[]> = {};
    filtered.forEach((c) => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    });
    return map;
  }, [filtered, catFilter, search]);

  const handleCatFilter = (key: string) => {
    setCatFilter(key);
    setExpandedCat(null);
    setSearchParams(key === 'all' ? {} : { cat: key });
  };

  const handleCartToggle = (course: Course, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasIn = inCart(course.id!);
    toggleCart(course.id!);
    showToast(
      wasIn
        ? `"${course.name}" eliminat del cistell`
        : `"${course.name}" afegit al cistell ✓`,
      wasIn ? 'info' : 'success'
    );
  };

  const toggleCategory = (cat: string) => {
    setExpandedCat(prev => prev === cat ? null : cat);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Capçalera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('courses.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {courses.filter(c => c.status === 'active').length} cursos disponibles
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Nou curs
          </Button>
        )}
      </div>

      {/* Cercador */}
      <Input
        placeholder={t('courses.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      {/* Filtres de categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button key={cat.key} onClick={() => handleCatFilter(cat.key)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all border',
              catFilter === cat.key
                ? 'bg-accent-500 text-white border-accent-500'
                : 'border-[var(--border-base)] hover:border-accent-500/50',
            ].join(' ')}
            style={catFilter !== cat.key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' } : {}}>
            {cat.key !== 'all' && <CourseIcon category={cat.key as CourseCategory} size={14} />}
            {t(cat.label)}
          </button>
        ))}
      </div>

      {/* Llista de cursos */}
      {grouped ? (
        /* Vista accordió per categories */
        <div className="flex flex-col gap-2">
          {Object.entries(grouped).map(([cat, items]) => (
            <AccordionSection
              key={cat}
              category={cat as CourseCategory}
              courses={items}
              isExpanded={expandedCat === cat}
              onToggle={() => toggleCategory(cat)}
              t={t}
              inCart={inCart}
              onCartToggle={handleCartToggle}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={28} />} title={t('courses.no_results')} />
      ) : (
        /* Vista filtrada: targetes detallades */
        <div className="flex flex-col gap-2.5">
          {filtered.map((c) => (
            <DetailedCourseCard
              key={c.id}
              course={c}
              t={t}
              inCart={inCart(c.id!)}
              onCartToggle={handleCartToggle}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <CourseFormModal open={showAdd} onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); showToast(t('courses.saved'), 'success'); }} />
      )}
    </div>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function AccordionSection({ category, courses, isExpanded, onToggle, t, inCart, onCartToggle }: {
  category: CourseCategory;
  courses: Course[];
  isExpanded: boolean;
  onToggle: () => void;
  t: (k: string) => string;
  inCart: (id: number) => boolean;
  onCartToggle: (c: Course, e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: isExpanded ? 'rgba(14,165,233,0.35)' : 'var(--border-base)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradients[category] ?? 'from-gray-700 to-gray-900'}`}>
          <CourseIcon category={category} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t(`cat.${category}`)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {courses.length} {courses.length === 1 ? 'curs disponible' : 'cursos disponibles'}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="flex-shrink-0 transition-transform duration-300"
          style={{
            color: isExpanded ? 'rgb(56,189,248)' : 'var(--text-faint)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isExpanded && (
        <div
          className="flex flex-col gap-2 px-3 pb-3 border-t"
          style={{ borderColor: 'var(--border-base)' }}
        >
          {courses.map((c) => (
            <DetailedCourseCard
              key={c.id}
              course={c}
              t={t}
              inCart={inCart(c.id!)}
              onCartToggle={onCartToggle}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detailed Course Card ─────────────────────────────────────────────────────

function DetailedCourseCard({
  course, t, inCart, onCartToggle, nested = false,
}: {
  course: Course;
  t: (k: string) => string;
  inCart: boolean;
  onCartToggle: (c: Course, e: React.MouseEvent) => void;
  nested?: boolean;
}) {
  const { getPrice } = useSheetPrices();
  const displayPrice = getPrice(course.name, course.price);
  const seatsLeft = course.maxStudents - course.currentStudents;
  const isFull = seatsLeft <= 0 || course.status === 'full';

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all hover:border-accent-500/30 ${nested ? 'mt-1.5' : ''}`}
      style={{
        backgroundColor: nested ? 'var(--bg-elevated, #1a1a1a)' : 'var(--bg-card)',
        borderColor: 'var(--border-base)',
      }}
    >
      <Link to={`/cursos/${course.id}`} className="block p-4">
        {/* Capçalera: icona + nom + badges */}
        <div className="flex items-start gap-3">
          {!nested && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradients[course.category] ?? 'from-gray-700 to-gray-900'}`}>
              <CourseIcon category={course.category} size={22} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {course.name}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge className={`${LEVEL_COLORS[course.level] ?? ''} text-[10px] px-2 py-0`}>
                {t(`courses.level_${course.level}`)}
              </Badge>
              <Badge className={`${FORMAT_COLORS[course.format] ?? ''} text-[10px] px-2 py-0`}>
                {t(`courses.format_${course.format}`)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Descripció */}
        {course.description && (
          <p className="text-xs mt-2.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {course.description}
          </p>
        )}

        {/* Stats: durada + places + preu */}
        <div className="flex items-center gap-4 mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--border-base)' }}>
          <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Clock size={12} />
            <span className="text-xs">{course.duration}h</span>
          </div>
          <div
            className="flex items-center gap-1"
            style={{ color: isFull ? '#f87171' : seatsLeft <= 3 ? '#eab308' : 'var(--text-muted)' }}
          >
            <Users size={12} />
            <span className="text-xs">
              {isFull ? 'Complet' : `${seatsLeft} lliures`}
            </span>
          </div>
          <span className="ml-auto text-sm font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {displayPrice === 0 ? 'Gratuït' : formatCurrency(displayPrice)}
          </span>
        </div>
      </Link>

      {/* Peu: botó cistell */}
      <div
        className="flex items-center justify-end px-4 py-2.5 border-t"
        style={{ borderColor: 'var(--border-base)' }}
      >
        <button
          onClick={(e) => onCartToggle(course, e)}
          disabled={isFull}
          className={[
            'flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-semibold transition-all active:scale-95',
            inCart
              ? 'bg-green-500 text-white'
              : 'bg-accent-500 hover:bg-accent-600 text-white',
            isFull ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isFull
            ? 'Complet'
            : inCart
            ? <><Check size={13} /> Afegit</>
            : <><ShoppingCart size={13} /> Afegir al cistell</>
          }
        </button>
      </div>
    </div>
  );
}
