import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Clock, Users, ChevronRight, Plus, ShoppingCart, Check } from 'lucide-react';
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
import { CourseIcon, categoryGradients, pngBgColors } from '../components/ui/CourseIcon';
const PNG_CATEGORIES = ['excel','word','powerpoint','access','outlook','actic'];
import type { Course, CourseCategory } from '../types';
import { formatCurrency, getStatusColor } from '../utils/formatters';

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

  // Agrupem per categoria quan es veu "tots"
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
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <CategorySection
              key={cat} category={cat as CourseCategory} courses={items}
              t={t} inCart={inCart} onCartToggle={handleCartToggle}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={28} />} title={t('courses.no_results')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} t={t} inCart={inCart(c.id!)} onCartToggle={handleCartToggle} />
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

function CategorySection({ category, courses, t, inCart, onCartToggle }: {
  category: CourseCategory; courses: Course[];
  t: (k: string) => string;
  inCart: (id: number) => boolean;
  onCartToggle: (c: Course, e: React.MouseEvent) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={PNG_CATEGORIES.includes(category) ? 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0' : `w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradients[category] ?? 'from-gray-700 to-gray-900'}`}
          style={PNG_CATEGORIES.includes(category) ? { backgroundColor: pngBgColors[category] ?? '#f5f5f5' } : {}}>
          <CourseIcon category={category} size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t(`cat.${category}`)}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{courses.length} {courses.length === 1 ? 'curs' : 'cursos'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} t={t} inCart={inCart(c.id!)} onCartToggle={onCartToggle} />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course, t, inCart, onCartToggle }: {
  course: Course; t: (k: string) => string;
  inCart: boolean;
  onCartToggle: (c: Course, e: React.MouseEvent) => void;
}) {
  const seatsLeft = course.maxStudents - course.currentStudents;
  const isFull = seatsLeft <= 0 || course.status === 'full';

  const levelColors: Record<string, string> = {
    basic:        'text-green-500 bg-green-500/10 border-green-500/20',
    intermediate: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    advanced:     'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="rounded-2xl border overflow-hidden transition-all hover:border-accent-500/30"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
      <Link to={`/cursos/${course.id}`} className="block p-3.5">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div
            className={PNG_CATEGORIES.includes(course.category) ? 'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0' : `w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradients[course.category] ?? 'from-gray-700 to-gray-900'}`}
            style={PNG_CATEGORIES.includes(course.category) ? { backgroundColor: pngBgColors[course.category] ?? '#f5f5f5' } : {}}>
            <CourseIcon category={course.category} size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {course.name}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge className={`${levelColors[course.level]} text-[10px] px-2 py-0`}>
                {t(`courses.level_${course.level}`)}
              </Badge>
            </div>
          </div>
          <ChevronRight size={15} style={{ color: 'var(--text-faint)' }} className="flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {course.description}
        </p>
      </Link>

      {/* Peu de la targeta: preu + botó cistell */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t"
        style={{ borderColor: 'var(--border-base)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock size={11} className="inline mr-0.5" />{course.duration}h
          </span>
          <span className="text-sm font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
          </span>
        </div>
        {/* Botó cistell — directament a la targeta, sense anar al detall */}
        <button
          onClick={(e) => onCartToggle(course, e)}
          disabled={isFull}
          className={[
            'flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all active:scale-95',
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
            : <><ShoppingCart size={13} /> Afegir</>}
        </button>
      </div>
    </div>
  );
}
