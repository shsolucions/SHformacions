import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Clock, Users, MapPin, User, CheckCircle2,
  Edit, Trash2, Wallet, LogIn, Star, Tag, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { courseService } from '../services/courseService';
import { requestService } from '../services/requestService';
import { notificationService } from '../services/notificationService';
import { whatsappService } from '../services/whatsappService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
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
  const { session, isAdmin, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const load = async () => {
    if (!id) return;
    const c = await courseService.getById(Number(id));
    setCourse(c ?? null);
    if (c && session) {
      const reqs = await requestService.getByUser(session.userId);
      setHasRequest(reqs.some((r) => r.courseId === c.id));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) { setShowLoginPrompt(true); return; }
    if (!course || !session) return;
    setEnrolling(true);
    try {
      await requestService.create(session.userId, course.id!);
      await notificationService.create('Nova sol·licitud', `${session.name} ha sol·licitat "${course.name}"`, 'info');
      setHasRequest(true);
      showToast(t('courses.request_sent'), 'success');
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      showToast(msg === 'request_exists' ? t('courses.request_exists') : t('common.error_generic'), 'error');
    } finally {
      setEnrolling(false);
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
      <p className="text-gray-500 mb-4">{t('courses.no_courses')}</p>
      <Button size="sm" variant="ghost" onClick={() => navigate('/cursos')} icon={<ArrowLeft size={16} />}>{t('courses.back_to_list')}</Button>
    </div>
  );

  const seatsLeft = course.maxStudents - course.currentStudents;
  const isFull = seatsLeft <= 0 || course.status === 'full';
  const objectives = course.objectives?.split('\n').filter(Boolean) ?? [];
  const audience = course.targetAudience?.split('\n').filter(Boolean) ?? [];
  const tags = course.tags?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

  const levelColors: Record<string, string> = {
    basic: 'text-green-400 bg-green-500/10 border-green-500/20',
    intermediate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    advanced: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* Back */}
      <button onClick={() => navigate('/cursos')}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm w-fit">
        <ArrowLeft size={15} />{t('courses.back_to_list')}
      </button>

      {/* Hero card */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${categoryGradients[course.category]} p-[1px]`}>
        <div className="rounded-3xl bg-[#0d0d0d]/95 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryGradients[course.category]} flex items-center justify-center flex-shrink-0 shadow-xl`}>
              <CourseIcon category={course.category} size={36} />
            </div>
            {isAdmin && (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => setShowEdit(true)} />
                <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setShowDelete(true)} />
              </div>
            )}
          </div>
          <h1 className="text-xl font-black text-white font-display mt-4 leading-snug">{course.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className={levelColors[course.level]}>{t(`courses.level_${course.level}`)}</Badge>
            <Badge className={getStatusColor(course.status) + ' text-xs'} dot>{t(`courses.status_${course.status}`)}</Badge>
            <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">{t(`courses.format_${course.format}`)}</Badge>
          </div>
        </div>
      </div>

      {/* Price + Enroll CTA */}
      <Card className="border border-accent-500/20 bg-gradient-to-br from-accent-500/5 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-black text-white font-display">
              {course.price === 0 ? t('courses.free') : formatCurrency(course.price)}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {isFull
                ? <span className="text-red-400 font-medium">{t('courses.full')}</span>
                : `${seatsLeft} ${t('courses.seats_left')}`}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {hasRequest ? (
              <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium px-3 py-1.5 bg-green-500/10 rounded-xl border border-green-500/20">
                <CheckCircle2 size={15} />{t('courses.enrolled')}
              </div>
            ) : (
              <Button onClick={handleEnroll} loading={enrolling} disabled={isFull}
                icon={isAuthenticated ? <Wallet size={16} /> : <LogIn size={16} />}>
                {isAuthenticated ? 'Afegir al meu pressupost' : 'Sol·licitar plaça'}
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={<MessageSquare size={14} />}
              onClick={() => whatsappService.openCourseRequest(course.name)}>
              Consulta per WhatsApp
            </Button>
          </div>
        </div>
      </Card>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Clock size={14} />, label: t('courses.duration'), value: `${course.duration}h` },
          { icon: <Users size={14} />, label: 'Alumnes', value: `${course.currentStudents}/${course.maxStudents}` },
          ...(course.instructor ? [{ icon: <User size={14} />, label: t('courses.instructor'), value: course.instructor }] : []),
          ...(course.location ? [{ icon: <MapPin size={14} />, label: t('courses.location'), value: course.location }] : []),
          ...(course.startDate ? [{ icon: <Clock size={14} />, label: t('courses.start_date'), value: formatDate(course.startDate) }] : []),
          ...(course.endDate ? [{ icon: <Clock size={14} />, label: t('courses.end_date'), value: formatDate(course.endDate) }] : []),
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 p-3 rounded-xl bg-[#111] border border-[#1a1a1a]">
            <div className="flex items-center gap-1.5 text-gray-600 text-xs">{item.icon}<span>{item.label}</span></div>
            <p className="text-sm text-white font-medium truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <Card>
        <h2 className="text-base font-bold text-white font-display mb-3">{t('courses.description')}</h2>
        <p className="text-sm text-gray-400 leading-relaxed">{course.description}</p>
      </Card>

      {/* Target audience */}
      {audience.length > 0 && (
        <Card>
          <h2 className="text-base font-bold text-white font-display mb-3 flex items-center gap-2">
            <Star size={16} className="text-accent-400" /> A qui va dirigit
          </h2>
          <div className="flex flex-col gap-2">
            {audience.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-accent-400 flex-shrink-0 mt-0.5">→</span>{a}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Objectives / Temari */}
      {objectives.length > 0 && (
        <Card>
          <h2 className="text-base font-bold text-white font-display mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-accent-400" /> {t('courses.objectives')}
          </h2>
          <div className="flex flex-col gap-2.5">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-sm text-gray-300 leading-relaxed">{obj}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={13} className="text-gray-600" />
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-[#111] border border-[#1e1e1e] rounded-full px-3 py-1">{tag}</span>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      {!isAuthenticated && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-400 mb-3">Inicia sessió per guardar aquest curs al teu pressupost i sol·licitar plaça</p>
          <div className="flex gap-3 justify-center">
            <Link to="/register"><Button variant="outline" size="sm">Crear compte gratuït</Button></Link>
            <Link to="/login"><Button size="sm" icon={<LogIn size={14} />}>{t('auth.login')}</Button></Link>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <CourseFormModal open={showEdit} course={course} onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); showToast(t('courses.saved'), 'success'); load(); }} />
      )}
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title={t('courses.delete')} message={t('common.confirm_delete')} loading={deleting} />

      {/* Login prompt modal */}
      <Modal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} title="Guardar al pressupost" size="sm"
        footer={<>
          <Button size="sm" variant="ghost" onClick={() => setShowLoginPrompt(false)}>{t('common.cancel')}</Button>
          <Link to="/login"><Button icon={<LogIn size={15} />}>{t('auth.login')}</Button></Link>
        </>}>
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
            <Wallet size={24} className="text-accent-400" />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Per guardar <strong className="text-white">"{course.name}"</strong> al teu pressupost i sol·licitar la plaça, necessites iniciar sessió o crear un compte gratuït.
          </p>
          <p className="text-xs text-gray-600 mt-2">És gratuït i no té cap compromís.</p>
          <Link to="/register" className="block mt-3">
            <Button variant="outline" size="sm" fullWidth>Crear compte gratuït</Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}
