import React, { useEffect, useState } from 'react';
import { Award, Loader2, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { adminCloudService, type CloudProfile } from '../../services/adminCloudService';
import { cloudDiplomaService, type IssueDiplomaResult } from '../../services/cloudDiplomaService';
import { courseService } from '../../services/courseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Course } from '../../types';

/**
 * Modal d'emissió de diplomes — NOMÉS per admin.
 *
 * Flux:
 *  1. Carrega usuaris (Supabase profiles via admin-stats) i cursos (Dexie local)
 *  2. L'admin tria usuari + curs + durada + data
 *  3. Clica "Emetre" → cloudDiplomaService.issue()
 *  4. Mostra pantalla d'èxit amb enllaç al PDF + codi de verificació
 *
 * Ús:
 *   <IssueDiplomaModal open={o} onClose={() => setO(false)} />
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onIssued?: (result: IssueDiplomaResult) => void;
  /** Si es passa, pre-selecciona l'usuari. Opcional. */
  preselectedUserId?: string;
}

export function IssueDiplomaModal({
  open, onClose, onIssued, preselectedUserId,
}: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [users, setUsers] = useState<CloudProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [userId, setUserId] = useState('');
  const [courseKey, setCourseKey] = useState('');
  const [courseName, setCourseName] = useState('');
  const [hours, setHours] = useState('');
  const [issueDate, setIssueDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<IssueDiplomaResult | null>(null);

  // Reset estat quan obre/tanca
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setUserId('');
        setCourseKey('');
        setCourseName('');
        setHours('');
        setResult(null);
        setSubmitting(false);
      }, 200);
      return;
    }
    setUserId(preselectedUserId ?? '');

    // Carregar dades
    setLoadingData(true);
    Promise.all([
      adminCloudService.listUsers(100, 0).catch(() => ({
        items: [] as CloudProfile[], total: 0, limit: 100, offset: 0,
      })),
      courseService.getAll().catch(() => [] as Course[]),
    ])
      .then(([usersResp, coursesResp]) => {
        setUsers(usersResp.items);
        setCourses(coursesResp.filter((c) => c.status === 'active' || c.status === 'inactive'));
      })
      .finally(() => setLoadingData(false));
  }, [open, preselectedUserId]);

  // Quan es tria un curs, omplim courseName automàticament
  const handleCourseChange = (keyFromSelect: string) => {
    setCourseKey(keyFromSelect);
    const match = courses.find((c) => String(c.id) === keyFromSelect);
    if (match) {
      setCourseName(match.name);
      if (match.duration && !hours) setHours(String(match.duration));
    }
  };

  const canSubmit =
    !!userId && !!courseKey && !!courseName.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!userId || !courseKey || !courseName.trim()) {
        showToast(t('diploma.issue.missing'), 'warning');
      }
      return;
    }

    setSubmitting(true);
    try {
      const r = await cloudDiplomaService.issue({
        user_id: userId,
        course_key: courseKey,
        course_name: courseName.trim(),
        hours: hours ? Number(hours) : undefined,
        issue_date: issueDate,
      });
      setResult(r);
      showToast(t('diploma.issue.success'), 'success');
      onIssued?.(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[IssueDiploma]', err);
      showToast(`${t('diploma.issue.error')}: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyVerificationCode = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.verification_code).then(() => {
      showToast(t('common.copied') || 'Copiat', 'success');
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={t('diploma.issue.title')}>
      <div className="p-5 min-w-[320px]">
        {/* Estat: ÈXIT */}
        {result && (
          <div className="flex flex-col gap-4 items-center text-center py-2">
            <div className="w-14 h-14 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{t('diploma.issue.success')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {result.student_name} · {result.course_name}
              </p>
            </div>

            <div className="w-full bg-black/20 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">{t('diploma.verification_code')}</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-accent-400 font-mono text-sm">
                  {result.verification_code}
                </code>
                <button
                  onClick={copyVerificationCode}
                  className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white"
                  title="Copiar"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {result.pdf_url && (
              <a
                href={result.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500/20 text-accent-400 rounded-xl hover:bg-accent-500/30 transition-colors text-sm font-semibold"
              >
                <ExternalLink size={14} />
                {t('diploma.download')}
              </a>
            )}

            <Button variant="secondary" onClick={onClose} className="w-full">
              {t('common.close') || 'Tancar'}
            </Button>
          </div>
        )}

        {/* Estat: FORMULARI */}
        {!result && (
          <>
            {loadingData ? (
              <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span>{t('common.loading') || 'Carregant...'}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Usuari */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400">
                    {t('diploma.issue.select_user')}
                  </span>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm border bg-[var(--bg-card)] border-[var(--border-base)] text-white focus:outline-none focus:border-accent-500"
                  >
                    <option value="">— {t('diploma.issue.select_user')} —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.nickname})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Curs */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400">
                    {t('diploma.issue.select_course')}
                  </span>
                  <select
                    value={courseKey}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm border bg-[var(--bg-card)] border-[var(--border-base)] text-white focus:outline-none focus:border-accent-500"
                  >
                    <option value="">— {t('diploma.issue.select_course')} —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Nom del curs (editable, per si volen un custom) */}
                <Input
                  label={t('diploma.course')}
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Ex: Excel Bàsic"
                />

                {/* Durada */}
                <Input
                  label={t('diploma.issue.hours')}
                  type="number"
                  inputMode="numeric"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder={t('diploma.issue.hours_placeholder')}
                />

                {/* Data d'emissió */}
                <Input
                  label={t('diploma.issued_at')}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />

                {/* Botons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                    disabled={submitting}
                  >
                    {t('admin.modal.cancel')}
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1" disabled={!canSubmit}>
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin mr-1.5" size={14} />
                        {t('diploma.issue.submit')}...
                      </>
                    ) : (
                      <>
                        <Award size={14} className="mr-1.5" />
                        {t('diploma.issue.submit')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
