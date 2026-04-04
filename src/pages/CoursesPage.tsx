import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Clock, Users, ChevronRight, Plus, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { courseService } from '../services/courseService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CourseFormModal } from '../components/courses/CourseFormModal';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import type { Course, CourseCategory } from '../types';
import { formatCurrency, getStatusColor } from '../utils/formatters';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'cat.all' },
  { key: 'excel', label: 'cat.excel' },
  { key: 'word', label: 'cat.word' },
  { key: 'access', label: 'cat.access' },
  { key: 'outlook', label: 'cat.outlook' },
  { key: 'cloud', label: 'cat.cloud' },
  { key: 'ia', label: 'cat.ia' },
  { key: 'powerpoint', label: 'cat.powerpoint' },
  { key: 'actic', label: 'cat.actic' },
  { key: 'consulting', label: 'cat.consulting' },
];

export function CoursesPage() {
  const { isAdmin } = useAuth();
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
    setCourses(all);
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

  // Group by category for display
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white font-display">{t('courses.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{courses.filter(c => c.status === 'active').length} cursos disponibles</p>
        </div>
        {isAdmin && (
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAdd(true)}>
            {t('courses.add')}
          </Button>
        )}
      </div>

      {/* Search */}
      <Input placeholder={t('courses.search')} value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button key={cat.key} onClick={() => handleCatFilter(cat.key)}
            className={['flex-shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium transition-all border',
              catFilter === cat.key ? 'bg-accent-500 text-white border-accent-500 shadow-accent-lg' : 'bg-[#111] text-gray-400 border-[#222] hover:border-[#333]'
            ].join(' ')}>
            {cat.key !== 'all' && <CourseIcon category={cat.key as CourseCategory} size={16} />}
            {t(cat.label)}
          </button>
        ))}
      </div>

      {/* Grouped view (all categories) */}
      {grouped && !search ? (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <CategoryGroup key={cat} category={cat as CourseCategory} courses={items} t={t} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Filter size={32} />} title={t('courses.no_results')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((c) => <CourseCard key={c.id} course={c} t={t} />)}
        </div>
      )}

      {showAdd && (
        <CourseFormModal open={showAdd} onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); showToast(t('courses.saved'), 'success'); }} />
      )}
    </div>
  );
}

function CategoryGroup({ category, courses, t }: { category: CourseCategory; courses: Course[]; t: (k: string) => string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryGradients[category]} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <CourseIcon category={category} size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white font-display">{t(`cat.${category}`)}</h2>
          <p className="text-xs text-gray-500">{courses.length} {courses.length === 1 ? 'curs' : 'cursos'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-1">
        {courses.map((c) => <CourseCard key={c.id} course={c} t={t} />)}
      </div>
    </div>
  );
}

function CourseCard({ course, t }: { course: Course; t: (k: string) => string }) {
  const seatsLeft = course.maxStudents - course.currentStudents;
  const isFull = seatsLeft <= 0 || course.status === 'full';

  const levelColors: Record<string, string> = {
    basic: 'text-green-400 bg-green-500/10 border-green-500/20',
    intermediate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    advanced: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <Link to={`/cursos/${course.id}`}>
      <div className="group relative flex flex-col p-4 rounded-2xl bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#121212] transition-all duration-200 overflow-hidden h-full">
        {/* Subtle gradient top bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${categoryGradients[course.category]} opacity-60`} />

        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${categoryGradients[course.category]} flex items-center justify-center flex-shrink-0 shadow-md`}>
            <CourseIcon category={course.category} size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-accent-300 transition-colors">{course.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge className={`${levelColors[course.level]} text-xs`}>
                {t(`courses.level_${course.level}`)}
              </Badge>
              <Badge className={getStatusColor(course.status) + ' text-xs'}>
                {t(`courses.status_${course.status}`)}
              </Badge>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-700 group-hover:text-accent-400 transition-colors flex-shrink-0 mt-1" />
        </div>

        <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">{course.description}</p>

        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Clock size={11} />{course.duration}h
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Users size={11} />
              {isFull ? <span className="text-red-400">{t('courses.full')}</span> : `${seatsLeft} places`}
            </span>
          </div>
          <span className="text-base font-black text-accent-400 font-display">
            {course.price === 0 ? t('courses.free') : formatCurrency(course.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
