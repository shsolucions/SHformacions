import React, { useEffect, useState } from 'react';
import { Award, Download, Loader2, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { cloudDiplomaService, type CloudDiploma } from '../services/cloudDiplomaService';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/dateUtils';

/**
 * Pàgina per a l'usuari normal: mostra els diplomes que li ha emès l'admin.
 * Ruta suggerida: /diplomes
 */
export function DiplomasPage() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [diplomas, setDiplomas] = useState<CloudDiploma[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    cloudDiplomaService
      .list()
      .then(setDiplomas)
      .catch((err) => {
        console.error('[DiplomasPage]', err);
        showToast(t('cloud.sync_error'), 'error');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleDownload = async (d: CloudDiploma) => {
    if (!d.verification_code) {
      showToast('No hi ha URL disponible', 'error');
      return;
    }
    setDownloading(d.id);
    // Obrim la finestra ABANS de l'operació async per evitar el bloqueig
    // de popups de Safari iOS (que bloqueja window.open() cridat des d'async)
    const newTab = window.open('', '_blank');
    try {
      const url = await cloudDiplomaService.getSignedPdfUrl(d.verification_code);
      if (!url) {
        newTab?.close();
        showToast('No hem pogut generar l\'enllaç', 'error');
        return;
      }
      if (newTab) {
        newTab.location.href = url;
      } else {
        // Fallback si el navegador ha bloquejat la finestra
        window.location.href = url;
      }
    } catch {
      newTab?.close();
      showToast('Error al carregar el diploma', 'error');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!session) {
    return (
      <EmptyState
        icon={<Award size={40} />}
        title={t('diploma.title')}
        description={t('auth.login')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
          <Award size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white font-display">
            {t('diploma.title')}
          </h1>
          <p className="text-xs text-gray-500">
            {diplomas.length > 0
              ? `${diplomas.length} ${t('diploma.title').toLowerCase()}`
              : t('diploma.empty')}
          </p>
        </div>
      </div>

      {diplomas.length === 0 ? (
        <EmptyState
          icon={<Award size={40} />}
          title={t('diploma.empty')}
          description=""
        />
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
                    <h3 className="font-bold text-white truncate">
                      {d.course_name}
                    </h3>
                    {d.student_name && (
                      <p className="text-xs text-gray-500">{d.student_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
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
                  <div className="bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      {t('diploma.verification_code')}
                    </p>
                    <code className="text-xs text-accent-400 font-mono">
                      {d.verification_code}
                    </code>
                  </div>
                )}

                <Button
                  onClick={() => handleDownload(d)}
                  disabled={downloading === d.id || !d.verification_code}
                  size="sm"
                  className="w-full"
                >
                  {downloading === d.id ? (
                    <>
                      <Loader2 className="animate-spin mr-1.5" size={14} />
                      {t('common.loading') || 'Carregant...'}
                    </>
                  ) : (
                    <>
                      <Download size={14} className="mr-1.5" />
                      {t('diploma.download')}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
