# 📦 SHformacions — Migració Supabase + Multiidioma

Aquest paquet **substitueix** la teva carpeta `SHformacio` anterior i ja inclou:

- ✅ Backend Supabase (login, usuaris al núvol, pressuposts, diplomes)
- ✅ 10 idiomes amb suport RTL (ca, es, en, fr, de, it, pt, nl, ro, ar)
- ✅ Admin ocult amb 5 tocs al logo (`skinsad` / `Palestina!`)
- ✅ Dashboard admin al núvol (tab "Núvol")
- ✅ Sistema de diplomes amb PDF + verificació pública
- ✅ Sincronització Dexie ↔ Supabase (admin)
- ✅ Contrasenyes de mínim 6 caràcters (lletres + números + símbols)

---

## 🚀 Deploy habitual (el teu .bat)

El flux normal no canvia:

1. Substitueix la teva carpeta `D:\01 APP\SHformacio` per aquesta
2. Executa `DEPLOY-SHformacions.bat`

L'app arrencarà. **Sense configurar Supabase, funcionarà exactament com abans** (admin local + multiidioma + totes les funcions Dexie). Les funcions cloud estaran "apagades" fins que facis els 5 passos de sota.

---

## ⚙️ 5 passos a Supabase (només un cop, per activar funcions cloud)

### Pas 1 — Crear projecte Supabase i configurar `.env.local`

1. Ves a https://supabase.com/dashboard → crea un projecte nou
2. Anota **Project URL** i **anon key** (Settings → API)
3. Desactiva confirmació d'email: **Authentication → Providers → Email → "Confirm email" OFF**
4. Copia `.env.local.example` a `.env.local` i omple els valors:

```ini
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ADMIN_SHARED_SECRET=<el-que-generis-al-pas-3>
```

A Vercel, afegeix aquestes 3 variables a **Settings → Environment Variables**.

### Pas 2 — Executar els 3 scripts SQL (per ordre)

Obre l'**SQL Editor** de Supabase i executa, un rere l'altre, els fitxers de `supabase/sql/`:

1. `01-SUPABASE_SETUP.sql` — crea taules base (profiles, budgets, user_courses, diplomas)
2. `02-SUPABASE_DIPLOMAS_SETUP.sql` — crea bucket diplomes + funció RPC verificació
3. `03-SUPABASE_SYNC_SETUP.sql` — crea taules de sincronització (admin_courses)

### Pas 3 — Generar el secret admin

Al teu ordinador (Git Bash o PowerShell):

```bash
openssl rand -hex 32
```

Copia el valor → posa'l a `.env.local` a `VITE_ADMIN_SHARED_SECRET` **i** també el pujaràs a Supabase al pas 5.

### Pas 4 — Instal·lar Supabase CLI (un cop)

```bash
npm install -g supabase
supabase login
cd D:\01 APP\SHformacio
supabase link --project-ref <el-teu-project-ref>
```

El `project-ref` és la part de l'URL (p. ex. `abcdefghij` a `abcdefghij.supabase.co`).

### Pas 5 — Configurar secret i desplegar les 3 Edge Functions

```bash
# Configura el secret al núvol (el mateix valor que a .env.local)
supabase secrets set ADMIN_SHARED_SECRET=<el-valor-del-pas-3>

# Desplega les 3 Edge Functions
supabase functions deploy admin-stats   --no-verify-jwt
supabase functions deploy issue-diploma --no-verify-jwt
supabase functions deploy admin-sync    --no-verify-jwt
```

---

## ✅ Verificació final

Un cop completats els 5 passos:

- [ ] Executa `DEPLOY-SHformacions.bat`
- [ ] Entra a l'app → 5 tocs al logo → `skinsad` / `Palestina!` → ha d'entrar al dashboard
- [ ] Dashboard → tab **☁️ Núvol** → comptadors apareixen
- [ ] Registra un usuari nou amb email + PIN 6 dígits → apareix a Supabase Studio (taula `profiles`)
- [ ] Emet un diploma via admin → PDF es genera → visita `/verificar?codi=DIP-XXXX-XXXX` sense sessió → mostra vàlid
- [ ] Configuració → Panell Sync → Push cursos → apareixen a Supabase

---

## 🆘 Resolució d'errors

| Error | Causa | Solució |
|---|---|---|
| "Supabase no configurat" | Falta `.env.local` | Configura pas 1 |
| `admin-stats 401 unauthorized` | Secret no coincideix | Re-executa `supabase secrets set ADMIN_SHARED_SECRET=<valor>` |
| "weak_password" al registre | PIN massa curt | PINs han de ser 6 dígits |
| "email not confirmed" | Supabase en mode producció | Desactiva "Confirm email" a Auth |
| `verify_diploma_by_code does not exist` | SQL 3.4 no executat | Executa `02-SUPABASE_DIPLOMAS_SETUP.sql` |
| Àrab no s'inverteix | Manca de build neta | `npm run build` i recarrega |

---

## 📋 Què passa si NO configures Supabase

L'app continua funcionant amb:
- Admin local (5 tocs + `skinsad`/`Palestina!`)
- Usuaris Dexie locals (sense login cloud)
- 10 idiomes + RTL
- Totes les funcions existents abans de la migració

Les funcions que **NO** funcionaran (perquè depenen de Supabase):
- Login d'usuaris nous amb email
- Dashboard "☁️ Núvol" (mostrarà error)
- Emissió i verificació de diplomes
- Sincronització Dexie ↔ Supabase

Això t'ajuda a fer una presentació als directors amb l'app "vella" funcional i les noves funcions desactivades fins que estigui tot llest al núvol.

---

## 📂 Estructura clau (nova)

```
SHformacio/
├── .env.local.example           ← copia a .env.local
├── src/
│   ├── services/
│   │   ├── supabase.ts          (nou)
│   │   ├── authService.ts       (substituït — mirror-Dexie)
│   │   ├── cloudUserService.ts  (nou)
│   │   ├── cloudDiplomaService.ts (nou)
│   │   ├── adminCloudService.ts (nou)
│   │   └── adminSyncService.ts  (nou)
│   ├── context/
│   │   ├── AuthContext.tsx      (substituït)
│   │   └── LanguageContext.tsx  (substituït — 10 idiomes)
│   ├── i18n/
│   │   ├── ca.ts / es.ts / en.ts  (ampliats amb claus cloud/diplomes/sync)
│   │   └── fr.ts de.ts it.ts pt.ts nl.ts ro.ts ar.ts  (nous)
│   ├── components/admin/
│   │   ├── AdminCloudPanel.tsx
│   │   ├── IssueDiplomaModal.tsx
│   │   └── SyncAdminPanel.tsx
│   └── pages/
│       ├── DiplomasPage.tsx     (nou)
│       └── VerifyDiplomaPage.tsx (nou)
└── supabase/
    ├── sql/              ← executar 01, 02, 03 per ordre
    └── functions/        ← desplegar amb `supabase functions deploy`
        ├── admin-stats/
        ├── issue-diploma/
        └── admin-sync/
```

Si tens dubtes, demana ajuda abans de presentar davant dels directors.
