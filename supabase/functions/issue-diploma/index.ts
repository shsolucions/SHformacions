// =====================================================================
// Supabase Edge Function — issue-diploma
// =====================================================================
// Emet un diploma: genera un PDF amb pdf-lib, el puja al bucket Storage
// `diplomas`, i crea la fila corresponent a la taula `public.diplomas`.
//
// Protegida pel mateix mecanisme que admin-stats:
//   · Header `x-admin-secret` que ha de coincidir amb ADMIN_SHARED_SECRET
//
// Body (JSON):
// {
//   "user_id":       "uuid",           // requerit: a qui va el diploma
//   "course_key":    "excel-basic",    // requerit: clau tècnica del curs
//   "course_name":   "Excel Bàsic",    // requerit: nom humà del curs
//   "student_name":  "Joan Pérez",     // opcional: sobreescriu el del perfil
//   "hours":         40,               // opcional
//   "issuer_name":   "Saïd Ferreres",  // opcional
//   "issue_date":    "2026-04-18"      // opcional, default avui
// }
//
// Resposta (200):
// {
//   "id":                "uuid",
//   "verification_code": "DIP-XXXX-XXXX",
//   "pdf_url":           "https://.../storage/v1/object/sign/...",  // signed URL 1h
//   "issued_at":         "2026-04-18T10:00:00Z",
//   "student_name":      "Joan Pérez",
//   "course_name":       "Excel Bàsic"
// }
//
// Desplegament:
//   supabase functions deploy issue-diploma --no-verify-jwt
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  PDFDocument, StandardFonts, rgb,
} from 'https://esm.sh/pdf-lib@1.17.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_SHARED_SECRET = Deno.env.get('ADMIN_SHARED_SECRET')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-admin-secret, content-type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Codi de verificació llegible: DIP-ABCD-1234 */
function genVerificationCode(): string {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num = '23456789';
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
  return `DIP-${pick(alpha, 4)}-${pick(num, 4)}`;
}

/** Format de data curt: 18 d'abril de 2026 */
function formatDateCa(d: Date): string {
  const months = [
    'gener', 'febrer', 'març', 'abril', 'maig', 'juny',
    'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre',
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const prep = /^[aeiouh]/i.test(month) ? "d'" : 'de ';
  return `${day} ${prep}${month} de ${year}`;
}

/**
 * Sanititza un text perquè sigui segur per a les fonts estàndard de pdf-lib
 * (que usen WinAnsi encoding). Substitueix caràcters fora de WinAnsi per
 * equivalents ASCII, evitant errors "WinAnsi cannot encode character".
 *
 * Casos típics catalans:
 *  · (punt volat, U+00B7) → al WinAnsi ja és vàlid
 *  — – (dashes) → -
 *  " " (cometes tipogràfiques) → "
 *  ' ' (apòstrofs tipogràfics) → '
 *  … (ellipsis) → ...
 *  (espais exòtics) → espai normal
 */
function sanitizeForWinAnsi(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2027/g, '\u00B7')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\u20AC\u0152\u0153\u0160\u0161\u017D\u017E\u0178\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u2122]/g, '?');
}

/** Genera el PDF del diploma amb pdf-lib */
async function generateDiplomaPdf(params: {
  studentName: string;
  courseName: string;
  hours?: number;
  issuedAt: Date;
  verificationCode: string;
  issuerName: string;
}): Promise<Uint8Array> {
  const { studentName: rawStudentName, courseName: rawCourseName, hours, issuedAt, verificationCode, issuerName: rawIssuerName } = params;

  // Sanititzar textos d'origen extern (poden tenir caràcters no-WinAnsi)
  const studentName = sanitizeForWinAnsi(rawStudentName);
  const courseName = sanitizeForWinAnsi(rawCourseName);
  const issuerName = sanitizeForWinAnsi(rawIssuerName);

  const pdfDoc = await PDFDocument.create();
  // A4 horitzontal: 842 × 595 pt
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const helv = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvObl = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesB = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Colors: blau marí SH + daurat
  const navy = rgb(0.04, 0.09, 0.2);       // #0a162b
  const navyDark = rgb(0.02, 0.05, 0.12);
  const gold = rgb(0.79, 0.66, 0.30);      // #C9A84C
  const goldLight = rgb(0.95, 0.88, 0.68);
  const text = rgb(0.12, 0.15, 0.22);
  const gray = rgb(0.45, 0.48, 0.55);

  // Fons lleuger
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: rgb(0.996, 0.992, 0.980), // #fefdfa
  });

  // Marc exterior daurat
  const M = 20;
  page.drawRectangle({
    x: M, y: M, width: width - 2 * M, height: height - 2 * M,
    borderColor: gold, borderWidth: 2,
  });
  // Marc interior fi
  page.drawRectangle({
    x: M + 8, y: M + 8, width: width - 2 * (M + 8), height: height - 2 * (M + 8),
    borderColor: gold, borderWidth: 0.5,
  });

  // Barres superiors i inferiors (navy)
  page.drawRectangle({
    x: M + 30, y: height - 70, width: width - 2 * (M + 30), height: 3,
    color: navy,
  });
  page.drawRectangle({
    x: M + 30, y: 65, width: width - 2 * (M + 30), height: 3,
    color: navy,
  });

  // Títol principal
  const title = 'DIPLOMA';
  const titleSize = 56;
  const titleW = timesB.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleW) / 2,
    y: height - 160,
    size: titleSize,
    font: timesB,
    color: navy,
  });

  // Subtítol
  const sub = "d'Aprofitament";
  const subSize = 22;
  const subW = timesB.widthOfTextAtSize(sub, subSize);
  page.drawText(sub, {
    x: (width - subW) / 2,
    y: height - 195,
    size: subSize,
    font: timesB,
    color: gold,
  });

  // "Es certifica que"
  const certify = 'Es certifica que';
  const certifySize = 14;
  const certifyW = helvReg.widthOfTextAtSize(certify, certifySize);
  page.drawText(certify, {
    x: (width - certifyW) / 2,
    y: height - 260,
    size: certifySize,
    font: helvReg,
    color: gray,
  });

  // Nom de l'alumne (el més destacat)
  const nameSize = 36;
  const nameW = timesB.widthOfTextAtSize(studentName, nameSize);
  page.drawText(studentName, {
    x: (width - nameW) / 2,
    y: height - 310,
    size: nameSize,
    font: timesB,
    color: navyDark,
  });
  // Subratllat
  page.drawLine({
    start: { x: (width - nameW) / 2 - 10, y: height - 320 },
    end:   { x: (width + nameW) / 2 + 10, y: height - 320 },
    thickness: 0.8,
    color: gold,
  });

  // "ha completat amb aprofitament el curs de"
  const line2 = "ha completat amb aprofitament el curs de";
  const line2Size = 13;
  const line2W = helvReg.widthOfTextAtSize(line2, line2Size);
  page.drawText(line2, {
    x: (width - line2W) / 2,
    y: height - 355,
    size: line2Size,
    font: helvReg,
    color: gray,
  });

  // Nom del curs
  const courseSize = 24;
  const courseW = helv.widthOfTextAtSize(courseName, courseSize);
  page.drawText(courseName, {
    x: (width - courseW) / 2,
    y: height - 395,
    size: courseSize,
    font: helv,
    color: navy,
  });

  // Hores (si ho tenim)
  if (hours && hours > 0) {
    const hoursTxt = `amb una durada total de ${hours} hores`;
    const hoursSize = 12;
    const hoursW = helvObl.widthOfTextAtSize(hoursTxt, hoursSize);
    page.drawText(hoursTxt, {
      x: (width - hoursW) / 2,
      y: height - 425,
      size: hoursSize,
      font: helvObl,
      color: gray,
    });
  }

  // Data
  const dateTxt = `Emès el ${formatDateCa(issuedAt)}`;
  const dateSize = 11;
  const dateW = helvReg.widthOfTextAtSize(dateTxt, dateSize);
  page.drawText(dateTxt, {
    x: (width - dateW) / 2,
    y: 130,
    size: dateSize,
    font: helvReg,
    color: text,
  });

  // Signatura
  const signLine = 'SHformacions';
  const signSize = 16;
  page.drawText(signLine, {
    x: width / 2 - 60,
    y: 105,
    size: signSize,
    font: timesB,
    color: navy,
  });
  page.drawLine({
    start: { x: width / 2 - 80, y: 100 },
    end:   { x: width / 2 + 80, y: 100 },
    thickness: 0.5,
    color: gray,
  });
  page.drawText(issuerName, {
    x: width / 2 - 60,
    y: 85,
    size: 10,
    font: helvReg,
    color: gray,
  });

  // Segell (cercle daurat)
  const seal = { cx: width - 110, cy: 140, r: 42 };
  page.drawCircle({
    x: seal.cx, y: seal.cy, size: seal.r,
    borderColor: gold, borderWidth: 1.5,
    color: goldLight, opacity: 0.3,
  });
  page.drawCircle({
    x: seal.cx, y: seal.cy, size: seal.r - 6,
    borderColor: gold, borderWidth: 0.5,
  });
  page.drawText('SH', {
    x: seal.cx - 14, y: seal.cy - 2,
    size: 20, font: timesB, color: navy,
  });
  page.drawText('FORMACIONS', {
    x: seal.cx - 28, y: seal.cy - 18,
    size: 6, font: helv, color: navy,
  });
  // Cinta del segell (simplificada)
  page.drawText('★', {
    x: seal.cx - 4, y: seal.cy + 18,
    size: 12, font: timesB, color: gold,
  });

  // Codi de verificació (cantonada inferior dreta, text petit)
  const codeTxt = `Codi de verificació: ${verificationCode}`;
  page.drawText(codeTxt, {
    x: M + 30,
    y: 40,
    size: 8,
    font: helvReg,
    color: gray,
  });
  page.drawText('Verifica aquest diploma a: shformacions.cat/verificar', {
    x: M + 30,
    y: 28,
    size: 7,
    font: helvObl,
    color: gray,
  });

  return await pdfDoc.save();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // Auth
  const secret = req.headers.get('x-admin-secret') ?? '';
  if (!ADMIN_SHARED_SECRET || !safeEqual(secret, ADMIN_SHARED_SECRET)) {
    return json({ error: 'unauthorized' }, 401);
  }

  // Parse body
  let body: {
    user_id?: string;
    course_key?: string;
    course_name?: string;
    student_name?: string;
    hours?: number;
    issuer_name?: string;
    issue_date?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (!body.user_id || !body.course_key || !body.course_name) {
    return json(
      { error: 'missing_fields', fields: ['user_id', 'course_key', 'course_name'] },
      400
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Carreguem el nom de l'alumne del perfil si no ens l'han passat
    let studentName = body.student_name;
    if (!studentName) {
      const { data: profile } = await admin
        .from('profiles')
        .select('name')
        .eq('id', body.user_id)
        .maybeSingle();
      studentName = profile?.name ?? 'Alumne';
    }

    const issuedAt = body.issue_date ? new Date(body.issue_date) : new Date();
    if (Number.isNaN(issuedAt.getTime())) {
      return json({ error: 'invalid_issue_date' }, 400);
    }

    const verificationCode = genVerificationCode();

    // Generar PDF
    const pdfBytes = await generateDiplomaPdf({
      studentName,
      courseName: body.course_name,
      hours: body.hours,
      issuedAt,
      verificationCode,
      issuerName: body.issuer_name ?? 'SHformacions',
    });

    // Pujar al bucket. Path: "<user_id>/<verification_code>.pdf"
    const fileName = `${body.user_id}/${verificationCode}.pdf`;
    const { error: upErr } = await admin.storage
      .from('diplomas')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });
    if (upErr) {
      return json({ error: 'storage_upload_failed', message: upErr.message }, 500);
    }

    // Generar signed URL (vàlida 1h)
    const { data: signed, error: signedErr } = await admin.storage
      .from('diplomas')
      .createSignedUrl(fileName, 3600);
    const pdfUrl = signedErr ? null : signed?.signedUrl ?? null;

    // Inserir fila a `diplomas`
    const { data: diploma, error: insertErr } = await admin
      .from('diplomas')
      .insert({
        user_id: body.user_id,
        course_key: body.course_key,
        course_name: body.course_name,
        student_name: studentName,
        hours: body.hours ?? null,
        issued_at: issuedAt.toISOString(),
        pdf_url: pdfUrl,
        verification_code: verificationCode,
        issued_by: body.issuer_name ?? 'admin',
      })
      .select('*')
      .single();

    if (insertErr) {
      // Rollback: esborrem el PDF pujat
      await admin.storage.from('diplomas').remove([fileName]).catch(() => {});
      return json({ error: 'db_insert_failed', message: insertErr.message }, 500);
    }

    return json({
      id: diploma.id,
      verification_code: diploma.verification_code,
      pdf_url: diploma.pdf_url,
      issued_at: diploma.issued_at,
      student_name: studentName,
      course_name: body.course_name,
      hours: body.hours,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: 'internal_error', message: msg }, 500);
  }
});
