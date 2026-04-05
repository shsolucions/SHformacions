import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Clock, Users, MapPin, User, CheckCircle2,
  Edit, Trash2, ShoppingCart, Check, MessageSquare, Tag, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { courseService } from '../services/courseService';
import { whatsappService } from '../services/whatsappService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CourseFormModal } from '../components/courses/CourseFormModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CourseIcon, categoryGradients } from '../components/ui/CourseIcon';
import type { Course } from '../types';
import { formatCurrency, getStatusColor } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { inCart, toggleCart } = useCart();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    const c = await courseService.getById(Number(id));
    setCourse(c ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleAddToCart = () => {
    if (!course) return;
    const wasInCart = inCart(course.id!);
    toggleCart(course.id!);
    if (!wasInCart) {
      showToast(`"${course.name}" afegit al cistell ✓`, 'success');
    } else {
      showToast(`"${course.name}" eliminat del cistell`, 'info');
    }
  };

  const handleDelete = async () => {
    if (!course?.id) return;
    setDeleting(true);
    try {
      await courseService.delete(course.id);
      showToast(t('courses.deleted'), 'success');
      navigate('/cursos');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return (
    <div className="text-center py-16 px-5">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('courses.no_courses')}</p>
      <Button variant="ghost" className="mt-4" onClick={() => navigate('/cursos')} icon={<ArrowLeft size={16} />}>
        {t('courses.back_to_list')}
      </Button>
    </div>
  );

  const seatsLeft = course.maxStudents - course.currentStudents;
  const isFull = seatsLeft <= 0 || course.status === 'full';
  const objectives = course.objectives?.split('\n').filter(Boolean) ?? [];
  const audience = course.targetAudience?.split('\n').filter(Boolean) ?? [];
  const tags = course.tags?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const alreadyInCart = inCart(course.id!);

  const levelColors: Record<string, string> = {
    basic:        'text-green-500 bg-green-500/10 border-green-500/20',
    intermediate: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    advanced:     'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Tornar */}
      <button onClick={() => navigate('/cursos')}
        className="flex items-center gap-1.5 text-sm w-fit transition-colors"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={15} />{t('courses.back_to_list')}
      </button>

      {/* Hero del curs */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${categoryGradients[course.category] ?? 'from-gray-700 to-gray-900'} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <CourseIcon category={course.category} size={36} />
          </div>
          {isAdmin && (
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => setShowEdit(true)}
                className="text-white/70 hover:text-white hover:bg-white/10 border-white/20" />
              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setShowDelete(true)}
                className="text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/20" />
            </div>
          )}
        </div>
        <h1 className="text-lg font-bold mt-3 leading-snug" style={{ color: "#ffffff" }}>{course.name}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={levelColors[course.level]}>{t(`courses.level_${course.level}`)}</Badge>
          <Badge className="text-white/80 bg-white/10 border-white/20 text-xs">
            {t(`courses.format_${course.format}`)}
          </Badge>
        </div>
      </div>

      {/* PREU + CTA CISTELL */}
      <div className="rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {course.price === 0 ? 'Gratuït' : formatCurrency(course.price)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isFull
                ? <span className="text-red-500 font-medium">Complet</span>
                : `${seatsLeft} places disponibles`}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {/* BOTÓ CISTELL — sense login */}
            <button
              onClick={handleAddToCart}
              disabled={isFull}
              className={[
                'flex items-center gap-2 px-4 h-10 rounded-xl font-semibold text-sm transition-all active:scale-95',
                alreadyInCart
                  ? 'bg-green-500 text-white'
                  : 'bg-accent-500 hover:bg-accent-600 text-white',
                isFull ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {alreadyInCart
                ? <><Check size={16} /> Al cistell</>
                : <><ShoppingCart size={16} /> Afegir al cistell</>}
            </button>
            {/* WhatsApp */}
            <button
              onClick={() => whatsappService.openCourseRequest(course.name)}
              className="flex items-center gap-1.5 text-xs px-3 h-8 rounded-xl border transition-colors"
              style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.05)' }}
            >
              <MessageSquare size={13} /> Consulta per WhatsApp
            </button>
          </div>
        </div>

        {/* Indicador si ja és al cistell */}
        {alreadyInCart && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border-base)' }}>
            <div className="flex items-center gap-2 text-green-500 text-xs">
              <Check size={13} />
              <span>Afegit al cistell</span>
            </div>
            <Link to="/pressupost" className="text-accent-500 text-xs font-semibold hover:underline">
              Veure cistell →
            </Link>
          </div>
        )}
      </div>

      {/* Detalls */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: <Clock size={13} />, label: 'Durada', value: `${course.duration}h` },
          { icon: <Users size={13} />, label: 'Places', value: `${course.currentStudents}/${course.maxStudents}` },
          ...(course.instructor ? [{ icon: <User size={13} />, label: 'Instructor', value: course.instructor }] : []),
          ...(course.location ? [{ icon: <MapPin size={13} />, label: 'Lloc', value: course.location }] : []),
          ...(course.startDate ? [{ icon: <Clock size={13} />, label: 'Inici', value: formatDate(course.startDate) }] : []),
          ...(course.endDate ? [{ icon: <Clock size={13} />, label: 'Fi', value: formatDate(course.endDate) }] : []),
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3 border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              {item.icon}<span>{item.label}</span>
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Descripció */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Descripció</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
      </div>

      {/* A qui va dirigit */}
      {audience.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Star size={14} className="text-accent-500" /> A qui va dirigit
          </h2>
          <div className="flex flex-col gap-1.5">
            {audience.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-accent-500 flex-shrink-0 mt-0.5 text-xs">→</span>{a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temari */}
      {objectives.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <CheckCircle2 size={14} className="text-accent-500" /> Temari
          </h2>
          <div className="flex flex-col gap-2">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent-500/15 text-accent-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Etiquetes */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={12} style={{ color: 'var(--text-faint)' }} />
          {tags.map((tag) => (
            <span key={tag} className="text-xs rounded-full px-3 py-1 border"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-base)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA baix si no és al cistell */}
      {!alreadyInCart && !isFull && (
        <button
          onClick={handleAddToCart}
          className="w-full h-12 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <ShoppingCart size={18} /> Afegir al cistell — {formatCurrency(course.price)}
        </button>
      )}
      {alreadyInCart && (
        <Link to="/pressupost"
          className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95">
          <Check size={18} /> Veure cistell ({course.price === 0 ? 'Gratuït' : formatCurrency(course.price)})
        </Link>
      )}

      {/* Modals admin */}
      {showEdit && (
        <CourseFormModal open={showEdit} course={course} onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); showToast(t('courses.saved'), 'success'); load(); }} />
      )}
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title={t('courses.delete')} message={t('common.confirm_delete')} loading={deleting} />
    </div>
  );
}
