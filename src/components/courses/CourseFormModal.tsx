import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { useTranslation } from '../../context/LanguageContext';
import { courseService } from '../../services/courseService';
import type { Course, CourseFormData } from '../../types';
import { timestampToDateString } from '../../utils/dateUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  course?: Course;
}

const emptyForm: CourseFormData = {
  name: '', description: '', category: 'excel', level: 'basic', format: 'presential',
  duration: 8, price: 0, maxStudents: 10, instructor: '', location: '',
  startDate: '', endDate: '', status: 'active', objectives: '', tags: '', targetAudience: '',
};

export function CourseFormModal({ open, onClose, onSaved, course }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CourseFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!course;

  useEffect(() => {
    if (course) {
      setForm({
        name: course.name, description: course.description,
        category: course.category, level: course.level, format: course.format,
        duration: course.duration, price: course.price, maxStudents: course.maxStudents,
        instructor: course.instructor ?? '', location: course.location ?? '',
        startDate: course.startDate ? timestampToDateString(course.startDate) : '',
        endDate: course.endDate ? timestampToDateString(course.endDate) : '',
        status: course.status, objectives: course.objectives ?? '',
        tags: course.tags ?? '', targetAudience: course.targetAudience ?? '',
      });
    } else { setForm(emptyForm); }
    setErrors({});
  }, [course, open]);

  const set = (field: keyof CourseFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('common.required');
    if (!form.description.trim()) errs.description = t('common.required');
    if (Number(form.duration) <= 0) errs.duration = t('common.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing && course?.id) { await courseService.update(course.id, form); }
      else { await courseService.create(form); }
      onSaved();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const categoryOptions = ['excel','word','powerpoint','access','outlook','cloud','ia','actic','it_repair','consulting']
    .map((c) => ({ value: c, label: t(`cat.${c}`) }));
  const levelOptions = ['basic','intermediate','advanced']
    .map((l) => ({ value: l, label: t(`courses.level_${l}`) }));
  const formatOptions = ['presential','online','hybrid']
    .map((f) => ({ value: f, label: t(`courses.format_${f}`) }));
  const statusOptions = ['active','inactive','full','draft']
    .map((s) => ({ value: s, label: t(`courses.status_${s}`) }));

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('courses.edit') : t('courses.add')} size="lg"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
        <Button size="sm" onClick={handleSave} loading={loading}>{t('common.save')}</Button>
      </>}>
      <div className="flex flex-col gap-4">
        <Input label={t('courses.name')} value={form.name} onChange={set('name')} error={errors.name} required placeholder={t('courses.name_placeholder')} />
        <Textarea label={t('courses.description')} value={form.description} onChange={set('description')} error={errors.description} required placeholder={t('courses.description_placeholder')} rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('courses.category')} value={form.category} onChange={set('category')} options={categoryOptions} />
          <Select label={t('courses.level')} value={form.level} onChange={set('level')} options={levelOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('courses.format')} value={form.format} onChange={set('format')} options={formatOptions} />
          <Select label={t('courses.status')} value={form.status} onChange={set('status')} options={statusOptions} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label={t('courses.duration')} type="number" value={form.duration} onChange={set('duration')} error={errors.duration} min={1} />
          <Input label={t('courses.price')} type="number" value={form.price} onChange={set('price')} min={0} />
          <Input label={t('courses.max_students')} type="number" value={form.maxStudents} onChange={set('maxStudents')} min={1} />
        </div>
        <Input label={t('courses.instructor')} value={form.instructor ?? ''} onChange={set('instructor')} placeholder={t('courses.instructor_placeholder')} />
        <Input label={t('courses.location')} value={form.location ?? ''} onChange={set('location')} placeholder={t('courses.location_placeholder')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('courses.start_date')} type="date" value={form.startDate ?? ''} onChange={set('startDate')} />
          <Input label={t('courses.end_date')} type="date" value={form.endDate ?? ''} onChange={set('endDate')} />
        </div>
        <Textarea
          label="Públic objectiu (opcional)"
          value={form.targetAudience ?? ''}
          onChange={set('targetAudience')}
          placeholder="A qui va dirigit aquest curs (una línia per perfil)..."
          rows={3}
        />
        <Textarea label={`${t('courses.objectives')} (opcional)`} value={form.objectives ?? ''} onChange={set('objectives')} placeholder={t('courses.objectives_placeholder')} rows={5} />
        <Input label={`${t('courses.tags')} (opcional)`} value={form.tags ?? ''} onChange={set('tags')} placeholder={t('courses.tags_placeholder')} />
      </div>
    </Modal>
  );
}
