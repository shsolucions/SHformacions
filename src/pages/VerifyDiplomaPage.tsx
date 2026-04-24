import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Loader2, Award, Calendar, Clock } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { cloudDiplomaService, type CloudDiploma } from '../services/cloudDiplomaService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/dateUtils';

/**
 * Pàgina pública de verificació de diplomes.
 * Ruta suggerida: /verificar  o  /verificar?codi=DIP-XXXX-XXXX
 *
 * No requereix login. La RLS ja permet SELECT anon quan hi ha verification_code.
 */
export function VerifyDiplomaPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const [code, setCode] = useState(() => params.get('codi') ?? '');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CloudDiploma | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setChecking(true);
    setError(null);
    setChecked(false);
    setResult(null);
    // Posa el codi al URL per fer-lo compartible
    setParams({ codi: trimmed });

    try {
      const d = await cloudDiplomaService.verify(trimmed);
      setResult(d);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setChecked(true);
      setChecking(false);
    }
  };

  // Auto-verificar si ve amb ?codi=
  React.useEffect(() => {
    const initial = params.get('codi');
    if (initial && !checked && !checking) {
      setCode(initial);
      // micro-defer perquè l'estat estigui actualitzat
      setTimeout(() => {
        handleCheck();
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheck();
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5 py-4">
      <div className="text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-accent-500/15 text-accent-400 items-center justify-center mb-3">
          <Award size={26} />
        </div>
        <h1 className="text-2xl font-bold text-white font-display">
          {t('diploma.verify.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Introdueix el codi imprès al diploma per comprovar-ne la validesa.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400">
              {t('diploma.verification_code')}
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('diploma.verify.placeholder')}
              className="rounded-xl px-4 py-3 text-base border bg-[var(--bg-card)] border-[var(--border-base)] text-white font-mono tracking-wider focus:outline-none focus:border-accent-500"
              autoComplete="off"
            />
          </label>
          <Button type="submit" disabled={!code.trim() || checking}>
            {checking ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                {t('diploma.verify.checking')}
              </>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                {t('diploma.verify.check')}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Resultat */}
      {checked && !checking && (
        <>
          {error && (
            <Card>
              <div className="p-4 flex items-start gap-3 text-red-400">
                <XCircle className="flex-shrink-0" size={20} />
                <div className="text-sm font-mono break-all">{error}</div>
              </div>
            </Card>
          )}

          {!error && !result && (
            <Card>
              <div className="p-5 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
                  <XCircle size={28} />
                </div>
                <div>
                  <p className="font-bold text-white">{t('diploma.verify.invalid')}</p>
                  <p className="text-xs text-gray-500 mt-1">Codi: {code}</p>
                </div>
              </div>
            </Card>
          )}

          {!error && result && (
            <Card>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {t('diploma.verify.valid')}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {result.verification_code}
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                  {result.student_name && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {/* Alumne */}
                        Alumne
                      </p>
                      <p className="font-bold text-white">{result.student_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {t('diploma.course')}
                    </p>
                    <p className="font-semibold text-accent-400">{result.course_name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{formatDate(new Date(result.issued_at).getTime())}</span>
                    </div>
                    {result.hours && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{result.hours}h</span>
                      </div>
                    )}
                  </div>
                  {result.issued_by && (
                    <div className="pt-1 text-xs text-gray-500">
                      {t('diploma.issued_by')}: <span className="text-gray-300">{result.issued_by}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
