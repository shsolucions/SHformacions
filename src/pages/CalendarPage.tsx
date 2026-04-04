import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, BookOpen } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { courseService } from '../services/courseService';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { Course } from '../types';
import { getCategoryColor } from '../utils/formatters';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, isSameDay } from '../utils/dateUtils';

const MONTH_KEYS = [
  'month.january','month.february','month.march','month.april',
  'month.may','month.june','month.july','month.august',
  'month.september','month.october','month.november','month.december',
];
const DAY_KEYS = ['day.mon','day.tue','day.wed','day.thu','day.fri','day.sat','day.sun'];

export function CalendarPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    courseService.getAll().then((c) => {
      setCourses(c.filter((x) => x.startDate));
      setLoading(false);
    });
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  // Adjust: getFirstDayOfMonth returns 0=Sun, convert to Mon-first (0=Mon)
  const rawFirst = getFirstDayOfMonth(year, month);
  const firstDayMon = rawFirst === 0 ? 6 : rawFirst - 1;

  // Build calendar grid cells
  const cells: (Date | null)[] = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Map of date-string → courses
  const eventMap = useMemo(() => {
    const map: Record<string, Course[]> = {};
    courses.forEach((c) => {
      if (!c.startDate) return;
      const d = new Date(c.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [courses]);

  const getCoursesForDate = (date: Date): Course[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventMap[key] ?? [];
  };

  const selectedCourses = selectedDate ? getCoursesForDate(selectedDate) : [];

  // Upcoming: next 30 days
  const upcoming = useMemo(() => {
    const now = Date.now();
    const limit = now + 1000 * 60 * 60 * 24 * 30;
    return courses
      .filter((c) => c.startDate && c.startDate >= now && c.startDate <= limit)
      .sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0));
  }, [courses]);

  const prevMonth = () =>
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-white font-display">{t('calendar.title')}</h1>

      {/* Month navigation */}
      <Card padding="sm">
        <div className="flex items-center justify-between px-1 py-1">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-base font-semibold text-white font-display capitalize">
              {t(MONTH_KEYS[month])} {year}
            </p>
          </div>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Today button */}
        <div className="flex justify-center pb-2">
          <button
            onClick={goToday}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors px-3 py-1 rounded-full hover:bg-accent-500/10"
          >
            {t('calendar.today')}
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_KEYS.map((key) => (
            <div key={key} className="text-center text-xs font-medium text-gray-600 py-1">
              {t(key)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dayEvents = getCoursesForDate(date);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={[
                  'aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative',
                  isSelected
                    ? 'bg-accent-500 text-white'
                    : isToday
                    ? 'bg-accent-500/20 text-accent-400 font-bold'
                    : 'text-gray-300 hover:bg-white/5',
                ].join(' ')}
              >
                <span className="text-sm font-medium leading-none">{date.getDate()}</span>
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-400" />
                )}
                {hasEvents && isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected day courses */}
      {selectedDate && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-2">
            {t('calendar.events_this_day')} — {formatDate(selectedDate.getTime())}
          </h2>
          {selectedCourses.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">{t('calendar.no_events')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedCourses.map((c) => (
                <CalendarCourseRow key={c.id} course={c} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">{t('calendar.upcoming')}</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('calendar.no_events')} />
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((c) => (
              <CalendarCourseRow key={c.id} course={c} t={t} showDate />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarCourseRow({
  course,
  t,
  showDate = false,
}: {
  course: Course;
  t: (k: string) => string;
  showDate?: boolean;
}) {
  return (
    <Link to={`/cursos/${course.id}`}>
      <div className="flex items-center gap-3 p-3 bg-[#141414] border border-[#222] rounded-xl hover:border-[#2a2a2a] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} className="text-accent-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{course.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {showDate && course.startDate
              ? `${t('calendar.starts')}: ${formatDate(course.startDate)}`
              : course.instructor ?? t(`courses.format_${course.format}`)}
          </p>
        </div>
        <Badge className={getCategoryColor(course.category)}>
          {t(`cat.${course.category}`)}
        </Badge>
      </div>
    </Link>
  );
}
