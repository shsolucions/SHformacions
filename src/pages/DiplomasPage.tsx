import React, { useEffect, useState } from 'react';
import { Award, Download, Loader2, Calendar, Clock, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { cloudDiplomaService, type CloudDiploma } from '../services/cloudDiplomaService';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/dateUtils';

export function DiplomasPage() {
  const { session, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [diplomas, setDiplomas] = useState<CloudDiploma[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CloudDiploma | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!session) { setLoading(false); return; }
    try {
      const data = isAdmin
        ? await cloudDiplomaService.adminListAll()
        : await cloudDiplomaService.list();
      setDiplomas(data);
    } catch (err) {
      console.error('[DiplomasPage]', err);
      // Si adminListAll falla per manca de SUPABASE_SERVICE_ROLE_KEY, fallback a list()
      if (isAdmin) {
        try {
          const data = await cloudDiplomaService.list();
          setDiplomas(data);
        } catch { showToast(t('cloud.sync_error'), 'error'); }
      } else {
        showToast(t('cloud.sync_error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [session, isAdmin]);

  const handleDownload = async (d: CloudDiploma) => {
    if (!d.verification_code) { showToast('No hi ha URL disponible', 'error'); return; }
    setDownloading(d.id);
    // Obrim la finestra ABANS de l'async per evitar el bloqueig de popups de Safari iOS
    const newTab = window.open('', '_blank');
    try {
      const url = await cloudDiplomaService.getSignedPdfUrl(d.verification_code);
      if (!url) {
        newTab?.close();
        showToast("No hem pogut generar l'enllaç", 'error');
        return;
      }
      if (newTab) { newTab.location.href = url; }
      else { window.location.href = url; }
    } catch {
      newTab?.close();
      showToast('Error al carregar el diploma', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cloudDiplomaService.remove(
        deleteTarget.id,
        deleteTarget.user_id,
        deleteTarget.verification_code
      );
      setDiplomas(prev => prev.filter(d => d.id !== deleteTarget.id));
      showToast(`Diploma de "${deleteTarget.student_name ?? deleteTarget.course_name}" eliminat`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error en eliminar', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!session) {
    return (
      <EmptyState icon={<Award size={40} />} title={t('diploma.title')} description={t('auth.login')} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Capçalera */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
          <Award size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            {t('diploma.title')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? `${diplomas.length} diploma${diplomas.length !== 1 ? 'es emesos' : ' emès'} — vista admin`
              : diplomas.length > 0
                ? `${diplomas.length} ${t('diploma.title').toLowerCase()}`
                : t('diploma.empty')}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Shield size={11} className="text-yellow-400" />
            <span className="text-[10px] font-semibold text-yellow-400">Admin</span>
          </div>
        )}
      </div>

      {diplomas.length === 0 ? (
        <EmptyState icon={<Award size={40} />} title={t('diploma.empty')} description="" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diplomas.map((d) => (
            <Card key={d.id}>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500/30 to-accent-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {d.course_name}
                    </h3>
                    {d.student_name && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.student_name}</p>
                    )}
                  </div>
                  {/* Botó eliminar — només admin */}
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                      title="Eliminar diploma"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(new Date(d.issued_at).getTime())}</span>
                  </div>
                  {d.hours && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{d.hours}h</span>
                    </div>
                  )}
                </div>

                {d.verification_code && (
                  <div className="rounded-lg px-3 py-2 border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-base)' }}>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                      {t('diploma.verification_code')}
                    </p>
                    <code className="text-xs text-accent-400 font-mono">
                      {d.verification_code}
                    </code>
                  </div>
                )}

                {/* Botó descarregar — només si l'usuari és el propietari (o admin amb pdf_url) */}
                {(!isAdmin || d.pdf_url) && (
                  <Button
                    onClick={() => handleDownload(d)}
                    disabled={downloading === d.id || !d.verification_code}
                    size="sm"
                    className="w-full"
                  >
                    {downloading === d.id ? (
                      <><Loader2 className="animate-spin mr-1.5" size={14} />{t('common.loading') || 'Carregant...'}</>
                    ) : (
                      <><Download size={14} className="mr-1.5" />{t('diploma.download')}</>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Diàleg de confirmació d'eliminació */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar diploma"
        message={`Segur que vols eliminar el diploma de "${deleteTarget?.student_name ?? deleteTarget?.course_name}"? S'eliminarà el registre i el PDF. Acció irreversible.`}
        loading={deleting}
        variant="danger"
        confirmLabel="Eliminar"
      />
    </div>
  );
}
