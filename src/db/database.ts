import Dexie, { type Table } from 'dexie';
import type { User, Course, ServiceRequest, Payment, Notification, AppSetting } from '../types';

export class SHformacionsDatabase extends Dexie {
  users!: Table<User, number>;
  courses!: Table<Course, number>;
  requests!: Table<ServiceRequest, number>;
  payments!: Table<Payment, number>;
  notifications!: Table<Notification, number>;
  settings!: Table<AppSetting, number>;

  constructor() {
    super('SHformacions_v2');
    this.version(1).stores({
      users:         '++id, nickname, role, active, createdAt',
      courses:       '++id, category, status, startDate, endDate, createdAt',
      requests:      '++id, userId, courseId, status, createdAt',
      payments:      '++id, userId, courseId, status, method, createdAt',
      notifications: '++id, userId, type, read, createdAt',
      settings:      '++id, &key',
    });
  }
}

export const db = new SHformacionsDatabase();

// ─────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────
export async function seedDatabase(): Promise<void> {
  const userCount = await db.users.count();
  if (userCount > 0) return;

  const now = Date.now();
  const hash = (pin: string) => hashForSeed(pin);

  // ── USUARIS ───────────────────────────────────────────────
  const adminId = await db.users.add({
    nickname: 'admin', name: 'Administrador SH', email: 'admin@shformacions.cat',
    pinHash: await hash('1234'), role: 'admin', active: true,
    createdAt: now - 86400000 * 30, updatedAt: now,
  });
  const userId = await db.users.add({
    nickname: 'demo', name: 'Usuari Demo', email: 'demo@exemple.com',
    pinHash: await hash('1234'), role: 'user', active: true,
    createdAt: now - 86400000 * 10, updatedAt: now,
  });

  // ── HELPER ────────────────────────────────────────────────
  const W = 86400000 * 7;
  const M = 86400000 * 30;

  const addCourse = (c: Omit<Course, 'id'>) => db.courses.add(c);

  // ══════════════════════════════════════════════════════════
  // EXCEL
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'Excel Inicial', category: 'excel', level: 'basic', format: 'presential',
    duration: 10, price: 90, maxStudents: 12, currentStudents: 3, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1',
    startDate: now + W, endDate: now + W + M,
    description: 'Primers passos amb Microsoft Excel. Aprèn a crear i gestionar fulls de càlcul des de zero, amb exercicis pràctics del dia a dia.',
    objectives: `Conèixer la interfície d'Excel: cinta, cel·les i llibres de treball
Seleccionar, copiar, moure i eliminar dades
Formats de cel·la: text, nombre, data, moneda
Fórmules bàsiques: suma, resta, multiplicació, divisió
Funcions essencials: SUMA, MITJANA, MÀXIM, MÍNIM
Ordenar i filtrar llistes de dades
Crear gràfics senzills (barres, línies, pastís)
Imprimir i exportar a PDF`,
    tags: 'excel,basics,formules,grafics', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Excel Intermedi', category: 'excel', level: 'intermediate', format: 'hybrid',
    duration: 16, price: 140, maxStudents: 12, currentStudents: 5, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Online',
    startDate: now + W * 2, endDate: now + W * 2 + M,
    description: 'Aprofundeix en Excel amb funcions avançades, taules dinàmiques i eines de productivitat per a l\'entorn professional.',
    objectives: `Funcions SI, SI.ERROR i lògiques (I, O)
BUSCARV, BUSCARH i funcions de cerca
Format condicional i regles personalitzades
Validació de dades i llistes desplegables
Taules dinàmiques: crear, agrupar i filtrar
Gràfics avançats i minigràfics (sparklines)
Treballar amb múltiples fulls i referència 3D
Protecció de cel·les, fulls i llibres`,
    tags: 'excel,buscarv,taules-dinamiques,format-condicional', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Excel Avançat', category: 'excel', level: 'advanced', format: 'hybrid',
    duration: 20, price: 180, maxStudents: 10, currentStudents: 2, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Online',
    startDate: now + W * 3, endDate: now + W * 3 + M * 2,
    description: 'Domina les eines més potents d\'Excel: macros, Power Query, dashboards i automatització. Nivell professional.',
    objectives: `Fórmules matricials i funcions ÍNDEX/COINCIDIR
Taules dinàmiques avançades i Power Pivot
Power Query: importar, netejar i transformar dades
Gràfics dinàmics i dashboards professionals
Introducció a les Macros i VBA bàsic
Anàlisi hipotètica: Busca Objectiu, Taules de Dades
Funcions de bases de dades (BDSUMA, BDMITJANA)
Automatització de tasques repetitives`,
    tags: 'excel,macros,vba,power-query,dashboards', createdAt: now - M, updatedAt: now,
  });

  // ══════════════════════════════════════════════════════════
  // WORD
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'Word Inicial', category: 'word', level: 'basic', format: 'presential',
    duration: 8, price: 75, maxStudents: 12, currentStudents: 4, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 2',
    startDate: now + W, endDate: now + W + M,
    description: 'Introducció a Microsoft Word per crear documents senzills: cartes, currículums i escrits del dia a dia.',
    objectives: `Conèixer la interfície de Word i la cinta d'opcions
Escriure, seleccionar i editar text bàsic
Formats de text: tipus de lletra, mida, negreta, cursiva
Paràgrafs: alineació, sagnies i espaiat
Inserir i formatar imatges i taules simples
Llistes amb vinyetes i numerades
Capçaleres, peus de pàgina i numeració
Guardar en Word i exportar a PDF`,
    tags: 'word,basics,documents,format', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Word Intermedi', category: 'word', level: 'intermediate', format: 'presential',
    duration: 12, price: 110, maxStudents: 12, currentStudents: 7, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 2',
    startDate: now + W * 2, endDate: now + W * 2 + M,
    description: 'Crea documents professionals de qualitat amb estils, plantilles, taules de contingut i eines de revisió.',
    objectives: `Estils de text i paràgraf: crear i aplicar
Temes i colors corporatius
Taules de contingut automàtiques
Notes a peu de pàgina i notes finals
Seccions, columnes i salts de pàgina
Combinació de correspondència (mailing)
Control de canvis i comentaris
Inserir objectes: gràfics, equacions, icones`,
    tags: 'word,estils,plantilles,correspondencia,revisio', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Word Avançat', category: 'word', level: 'advanced', format: 'hybrid',
    duration: 10, price: 120, maxStudents: 10, currentStudents: 1, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 2 / Online',
    startDate: now + W * 4, endDate: now + W * 4 + M,
    description: 'Automatitza i professionalitza els teus documents amb macros, formularis, documents mestres i eines avançades.',
    objectives: `Crear plantilles corporatives avançades
Formularis amb camps de contenidor de contingut
Macros bàsiques per automatitzar tasques
Documents mestres i subdocuments
Marcadors, referències creuades i hipervincles
Índexs i taules de figures automàtiques
Comparació i combinació de documents
Publicació i compatibilitat de formats`,
    tags: 'word,macros,formularis,documents-mestres', createdAt: now - M, updatedAt: now,
  });

  // ══════════════════════════════════════════════════════════
  // ACCESS
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'Access Inicial', category: 'access', level: 'basic', format: 'presential',
    duration: 10, price: 95, maxStudents: 10, currentStudents: 2, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1',
    startDate: now + W * 3, endDate: now + W * 3 + M,
    description: 'Descobreix les bases de dades relacionals amb Microsoft Access. Crea les teves primeres taules i consultes.',
    objectives: `Conceptes de base de dades relacional
Crear i configurar taules
Tipus de dades: text, número, data, Sí/No
Clau principal i clau forana
Relacions senzilles entre dues taules
Introduir i editar dades en taules
Consultes simples de selecció
Informes bàsics amb l'assistent`,
    tags: 'access,bbdd,taules,consultes', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Access Intermedi', category: 'access', level: 'intermediate', format: 'hybrid',
    duration: 14, price: 130, maxStudents: 10, currentStudents: 1, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Online',
    startDate: now + W * 4, endDate: now + W * 4 + M,
    description: 'Aprofundeix en Access amb consultes avançades, formularis, relacions múltiples i importació de dades.',
    objectives: `Relacions entre múltiples taules (1:N, N:M)
Consultes de selecció amb criteris avançats
Expressions i funcions en consultes
Formularis: crear, personalitzar i navegar
Subformularis i formularis vinculats
Consultes de paràmetres interactives
Informes amb agrupaments i totals
Importar i exportar dades (Excel, CSV)`,
    tags: 'access,formularis,consultes-avancades,relacions', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Access Avançat', category: 'access', level: 'advanced', format: 'hybrid',
    duration: 16, price: 155, maxStudents: 8, currentStudents: 0, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Online',
    startDate: now + W * 5, endDate: now + W * 5 + M,
    description: 'Dissenya aplicacions de base de dades professionals amb macros, VBA i gestió multi-usuari.',
    objectives: `Consultes d'acció: afegir, actualitzar, eliminar
SQL bàsic en Access
Macros: crear, condicionar i executar
Mòduls VBA: funcions personalitzades
Menús i panells de navegació a mida
Bases de dades multi-usuari i seguretat
Vinculació de taules externes (Excel, ODBC)
Distribució i empaquetat d'aplicacions`,
    tags: 'access,vba,sql,macros,multi-usuari', createdAt: now - M, updatedAt: now,
  });

  // ══════════════════════════════════════════════════════════
  // OUTLOOK (sense nivells per petició)
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'Outlook: Gestió Professional del Correu', category: 'outlook', level: 'intermediate', format: 'online',
    duration: 8, price: 80, maxStudents: 15, currentStudents: 9, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online (Zoom)',
    startDate: now + W, endDate: now + W + M / 2,
    description: 'Domina Microsoft Outlook per gestionar el correu, calendari i tasques de forma eficient i professional.',
    objectives: `Configuració del compte i interfície d'Outlook
Redactar, respondre i reenviar correus
Regles i filtres automàtics per organitzar la bústia
Categories, carpetes i arxiu de missatges
Calendari: crear cites, events i reunions recurrents
Invitacions de reunió i gestió de respostes
Llistes de tasques i recordatoris
Contactes i llistes de distribució
Signatura professional i resposta automàtica
Cerca avançada i gestió de l'arxiu`,
    tags: 'outlook,correu,calendari,productivitat,tasques', createdAt: now - M, updatedAt: now,
  });

  // ══════════════════════════════════════════════════════════
  // CLOUD / MICROSOFT 365
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'Microsoft 365 Inicial', category: 'cloud', level: 'basic', format: 'online',
    duration: 10, price: 100, maxStudents: 15, currentStudents: 4, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online (Teams)',
    startDate: now + W * 2, endDate: now + W * 2 + M,
    description: 'Introducció a Microsoft 365: aprèn a treballar al núvol amb les eines més usades en l\'entorn empresarial.',
    objectives: `Conceptes bàsics de núvol i Microsoft 365
Compte Microsoft: configuració i seguretat
OneDrive: guardar, compartir i sincronitzar fitxers
Word, Excel i PowerPoint Online
Microsoft Teams: xats i trucades bàsiques
Outlook Online: gestió del correu
SharePoint: explorar llocs d'equip
Bones pràctiques de seguretat digital`,
    tags: 'cloud,microsoft365,onedrive,teams', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Microsoft 365 Intermedi', category: 'cloud', level: 'intermediate', format: 'hybrid',
    duration: 16, price: 150, maxStudents: 12, currentStudents: 3, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Teams',
    startDate: now + W * 3, endDate: now + W * 3 + M,
    description: 'Potencia la col·laboració en equip amb Teams avançat, SharePoint, Planner i les eines de productivitat de M365.',
    objectives: `Microsoft Teams avançat: canals, tabs i connectors
Reunions Teams: presentació, gravació, sales de reunió
SharePoint: crear i gestionar llocs d'equip
Microsoft Planner i To Do per a gestió de tasques
Microsoft Forms: enquestes i formularis
OneNote Online: notes col·laboratives
Stream: vídeos corporatius
Power Automate: automatitzacions senzilles`,
    tags: 'cloud,teams,sharepoint,planner,forms', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Microsoft 365 Avançat per a Empreses', category: 'cloud', level: 'advanced', format: 'hybrid',
    duration: 24, price: 220, maxStudents: 10, currentStudents: 2, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Empresa / Teams',
    startDate: now + W * 4, endDate: now + W * 4 + M * 2,
    description: 'Administra i optimitza Microsoft 365 per a l\'empresa. Inclou Power Platform, Azure AD i governança.',
    objectives: `Microsoft 365 Admin Center: gestió d'usuaris i llicències
Azure Active Directory: identitat i accessos
Power Automate: fluxos de treball complexos
Power Apps: aplicacions sense codi
Power BI: dashboards i informes de negoci
SharePoint avançat: permisos i arquitectura d'informació
Seguretat i compliment normatiu (GDPR)
Governança i bones pràctiques empresarials`,
    tags: 'cloud,admin,power-platform,azure,powerbi', createdAt: now - M, updatedAt: now,
  });

  // ══════════════════════════════════════════════════════════
  // ACTIC
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'ACTIC Nivell 1 — Certificat Bàsic', category: 'actic', level: 'basic', format: 'presential',
    duration: 30, price: 150, maxStudents: 12, currentStudents: 5, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1',
    startDate: now + W, endDate: now + W + M * 2,
    description: 'Preparació oficial per a l\'examen ACTIC Nivell 1 (Certificat Bàsic) de la Generalitat de Catalunya. Supera la prova i acredita les teves competències digitals bàsiques.',
    objectives: `C1 · Cultura, participació i civisme digital: seguretat, privacitat, drets digitals, identitat en línia i participació ciutadana
C2 · Tecnologia digital i ordinador: maquinari, sistema operatiu Windows, gestió de fitxers i carpetes, configuració bàsica
C3 · Navegació i comunicació: navegadors, cercadors, correu electrònic, xarxes socials i comunicació en línia
C4 · Tractament de la informació escrita (N1): processador de textos bàsic, creació i format de documents senzills
C5 · Tractament d'informació gràfica (N1): captura i edició bàsica d'imatges, còpies de pantalla
C6 · Tractament de la informació numèrica (N1): full de càlcul bàsic, fórmules simples i gràfics
Simulacres d'examen oficial ACTIC i tècniques de preparació
Inscripció i procediment per fer la prova oficial`,
    tags: 'actic,nivell1,basic,certificat,generalitat', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'ACTIC Nivell 2 — Certificat Mitjà', category: 'actic', level: 'intermediate', format: 'hybrid',
    duration: 40, price: 200, maxStudents: 12, currentStudents: 3, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Online',
    startDate: now + W * 3, endDate: now + W * 3 + M * 3,
    description: 'Preparació completa per a l\'ACTIC Nivell 2 (Certificat Mitjà). Cobreix les 8 competències digitals al nivell 2 exigit per la Generalitat.',
    objectives: `C1 · Cultura digital (N2): seguretat avançada, ciberseguretat, GDPR, identitat digital professional
C2 · Tecnologia digital (N2): sistemes operatius, xarxes, virtualització, resolució de problemes
C3 · Navegació i comunicació (N2): serveis avançats en línia, col·laboració digital, gestió de la informació
C4 · Informació escrita (N2): Word avançat, combinació de correspondència, estils i plantilles
C5 · Informació gràfica i so (N2): edició d'imatge, vídeo i àudio a nivell intermedi
C6 · Informació numèrica (N2): Excel intermedi, taules dinàmiques, funcions de cerca
C7 · Tractament de dades (N2): bases de dades, Access bàsic, gestió i anàlisi de dades
C8 · Presentació de continguts (N2): PowerPoint avançat, disseny de presentacions, publicació digital`,
    tags: 'actic,nivell2,mitja,certificat,8-competencies', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'ACTIC Nivell 3 — Certificat Avançat', category: 'actic', level: 'advanced', format: 'hybrid',
    duration: 30, price: 180, maxStudents: 10, currentStudents: 1, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 1 / Online',
    startDate: now + W * 5, endDate: now + W * 5 + M * 2,
    description: 'Preparació per a l\'ACTIC Nivell 3 (Certificat Avançat). Tria 2 o més competències avançades entre C4-C8 i acredita el domini expert.',
    objectives: `C4 · Informació escrita (N3): Word avançat, macros, formularis complexos, documents mestres, publicació professional
C5 · Informació gràfica i so (N3): edició avançada d'imatge (Photoshop/GIMP), edició de vídeo i producció multimèdia
C6 · Informació numèrica (N3): Excel avançat, Power Query, macros VBA, models financers complexos
C7 · Tractament de dades (N3): Access avançat, SQL, bases de dades relacionals, automatitzacions
C8 · Presentació de continguts (N3): disseny gràfic professional, PowerPoint/Prezi avançat, infografies
Metodologia: mínim 2 competències a escollir per l'alumne
Simulacres d'examen i casos pràctics reals
Estratègia i gestió del temps a la prova oficial`,
    tags: 'actic,nivell3,avançat,certificat,professional', createdAt: now - M, updatedAt: now,
  });


  // ══════════════════════════════════════════════════════════
  // IA — Intel·ligència Artificial
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'IA Inicial: Introducció a la Intel·ligència Artificial', category: 'ia', level: 'basic', format: 'online',
    duration: 12, price: 120, maxStudents: 20, currentStudents: 6, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online (Zoom)',
    startDate: now + W, endDate: now + W + M,
    description: 'Descobreix la Intel·ligència Artificial des de zero. Aprèn a usar les eines d\'IA més potents del moment per millorar la teva productivitat personal i professional, sense necessitat de programar.',
    objectives: `Conceptes bàsics d'IA, Machine Learning i IA Generativa
ChatGPT, Claude i Gemini: diferències i usos pràctics
Prompting eficaç: tècniques per obtenir millors resultats
Generació i edició d'imatges amb IA (Midjourney, DALL·E)
Eines d'IA per a productivitat: Notion AI, Copilot, Perplexity
Automatitzar tasques repetitives amb IA
Seguretat, privacitat i límits ètics de la IA
Casos d'ús reals i pràctiques guiades`,
    tags: 'ia,chatgpt,claude,prompting,productivitat', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'IA Avançat: IA per a Empreses i Professionals', category: 'ia', level: 'advanced', format: 'hybrid',
    duration: 20, price: 200, maxStudents: 15, currentStudents: 3, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Empresa / Online',
    startDate: now + W * 2, endDate: now + W * 2 + M * 2,
    description: 'Implementa solucions d\'IA a la teva empresa. Automatitza processos, analitza dades i crea avantatge competitiu amb les eines d\'IA més avançades del mercat.',
    objectives: `Estratègia d'IA empresarial: com i on implementar-la
Microsoft Copilot per a M365: Word, Excel, Teams, Outlook
Automatització de processos amb Power Automate + IA
Anàlisi de dades i informes automàtics amb IA
Creació de contingut de màrqueting amb IA
Agents d'IA personalitzats per a l'empresa
Integració d'API d'IA (OpenAI, Anthropic, Google)
Governança, privacitat i implementació responsable`,
    tags: 'ia,copilot,automatitzacio,empresa,api', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'IA per a Marketing i Comunicació', category: 'ia', level: 'intermediate', format: 'online',
    duration: 8, price: 90, maxStudents: 20, currentStudents: 5, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online',
    description: 'Transforma el teu departament de màrqueting amb IA. Crea contingut, campanyes i estratègies més efectives en menys temps.',
    objectives: `Generació de textos per xarxes socials, web i newsletters
Creació d'imatges i vídeos curts amb IA
SEO i copywriting assistit per IA
Anàlisi de sentiment i tendències del mercat
Personalització de campanyes amb IA
Chatbots per a atenció al client i captació de leads
Automatització del calendari editorial
Eines: ChatGPT, Canva IA, Copy.ai, HubSpot IA`,
    tags: 'ia,marketing,contingut,xarxes-socials,seo', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'IA per a Recursos Humans', category: 'ia', level: 'intermediate', format: 'online',
    duration: 8, price: 90, maxStudents: 20, currentStudents: 2, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online',
    description: 'Optimitza els processos d\'RRHH amb IA: selecció de personal, formació, avaluació i gestió del talent de manera més eficient.',
    objectives: `Selecció de personal assistida per IA: criba de CV
Redacció d'ofertes de treball optimitzades
Chatbots d'onboarding per a nous empleats
Anàlisi de clima laboral amb IA
Formació personalitzada i plans de carrera amb IA
Avaluació del rendiment basada en dades
Detecció de riscos de rotació
Eines: LinkedIn Recruiter IA, Textio, Workday AI`,
    tags: 'ia,rrhh,seleccio,formacio,talent', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'IA per a Finances i Comptabilitat', category: 'ia', level: 'intermediate', format: 'online',
    duration: 8, price: 90, maxStudents: 20, currentStudents: 1, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online',
    description: 'Aplica la IA a les finances: automatitza informes, detecta anomalies, millora les previsions i pren millors decisions financeres.',
    objectives: `Automatització de conciliacions bancàries amb IA
Excel Copilot per a anàlisi financera avançada
Generació automàtica d'informes i presentacions
Detecció d'anomalies i frau amb Machine Learning
Previsions financeres i anàlisi predictiva
Lectura i extracció de dades de factures (OCR + IA)
Dashboards de control de gestió automatitzats
Eines: Copilot per Excel, Power BI IA, QuickBooks IA`,
    tags: 'ia,finances,comptabilitat,excel,power-bi', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'IA per a Vendes i Atenció al Client', category: 'ia', level: 'intermediate', format: 'online',
    duration: 8, price: 90, maxStudents: 20, currentStudents: 4, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Online',
    description: 'Millora les teves vendes i fidelitza clients amb IA. Des de chatbots fins a personalització avançada i predicció de vendes.',
    objectives: `Chatbots d'atenció al client: configuració i entrenament
Personalització de l'experiència del client amb IA
CRM intel·ligent: Salesforce IA, HubSpot IA
Predicció de vendes i anàlisi de pipeline
Generació de propostes comercials amb IA
Análisi de trucades de vendes amb IA (Gong, Chorus)
Segmentació de clients i campanyes personalitzades
Eines: ChatGPT API, Drift, Intercom IA`,
    tags: 'ia,vendes,crm,chatbot,atencio-client', createdAt: now - M, updatedAt: now,
  });


  // ══════════════════════════════════════════════════════════
  // POWERPOINT — 3 NIVELLS
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'PowerPoint Inicial', category: 'powerpoint', level: 'basic',
    format: 'presential', duration: 8, price: 75, maxStudents: 12, currentStudents: 2, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 2',
    startDate: now + W * 2, endDate: now + W * 2 + M,
    description: 'Aprèn a crear presentacions visuals atractives amb Microsoft PowerPoint des de zero. Ideal per a professionals que necessiten comunicar idees de forma clara i impactant.',
    targetAudience: `Persones sense coneixements de PowerPoint\nProfessionals que fan presentacions a feina\nEstudiants i autònoms`,
    objectives: `Conèixer la interfície de PowerPoint i els menús\nCrear una presentació nova des de zero\nAfegir i formatar text: fonts, mides i colors\nInserir imatges, formes i icones\nAplicar temes i dissenys predefinits\nAfegir transicions entre diapositives\nInserir animacions bàsiques als elements\nPresentar en pantalla completa i exportar a PDF`,
    tags: 'powerpoint,presentacions,disseny,diapositives', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'PowerPoint Intermedi', category: 'powerpoint', level: 'intermediate',
    format: 'hybrid', duration: 12, price: 110, maxStudents: 12, currentStudents: 1, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 2 / Online',
    startDate: now + W * 3, endDate: now + W * 3 + M,
    description: 'Crea presentacions professionals que destaquen. Aprèn tècniques de disseny, animacions avançades, gràfics i elements multimèdia per impressionar a qualsevol audiència.',
    targetAudience: `Usuaris amb coneixements bàsics de PowerPoint\nDirectius, comercials i formadors\nProfessionals que fan presentacions sovint`,
    objectives: `Disseny professional: composició i paletes de colors\nCrear patrón de diapositives corporatiu\nAnimacions avançades: entrada, sortida i moviment\nInserir i editar gràfics de dades dinàmics\nVídeos i àudio incrustats a la presentació\nSmartArt: diagrames i processos visuals\nSeccions i hipervincles entre diapositives\nExportar com a vídeo MP4 i presentació web`,
    tags: 'powerpoint,animacions,disseny,grafics,corporate', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: "PowerPoint Avançat: Presentacions d'Impacte", category: 'powerpoint', level: 'advanced',
    format: 'hybrid', duration: 10, price: 130, maxStudents: 10, currentStudents: 0, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Aula 2 / Online',
    startDate: now + W * 5, endDate: now + W * 5 + M,
    description: "Domina PowerPoint al nivell expert. Crea presentacions interactives, automatitzades i de disseny professional comparables als millors estudis de comunicació.",
    targetAudience: `Usuaris avançats de PowerPoint\nDireccions comercials i de màrqueting\nFormadors, coaches i conferenciants`,
    objectives: `Disseny Slide Master avançat per a marques\nMàscares, morfologia i efectes 3D\nAnimacions complexes i efectes cinematogràfics\nPresentacions interactives amb botons i branques\nIntegrar Excel: gràfics dinàmics vinculats\nMacros bàsiques per automatitzar presentacions\nTècniques de storytelling visual\nEines de col·laboració i presentació remota Teams`,
    tags: 'powerpoint,avançat,storytelling,macros,3d,corporate', createdAt: now - M, updatedAt: now,
  });

  // ══════════════════════════════════════════════════════════
  // IT REPAIR I CONSULTORIA (serveis)
  // ══════════════════════════════════════════════════════════
  await addCourse({
    name: 'Servei de Reparació i Manteniment IT', category: 'it_repair', level: 'basic', format: 'presential',
    duration: 2, price: 60, maxStudents: 1, currentStudents: 0, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Taller SH Solucions',
    description: 'Servei professional de diagnòstic, reparació i manteniment d\'ordinadors, portàtils i dispositius.',
    objectives: `Diagnòstic complet de maquinari i programari
Neteja física i tèrmica del sistema
Instal·lació i reinstal·lació de Windows
Actualització de drivers i components
Eliminació de virus i malware
Recuperació i còpia de seguretat de dades
Ampliació de memòria RAM i emmagatzematge SSD
Assessorament sobre actualitzacions i compres`,
    tags: 'reparacio,manteniment,windows,virus,dades', createdAt: now - M, updatedAt: now,
  });

  await addCourse({
    name: 'Consultoria IT per a Empreses', category: 'consulting', level: 'advanced', format: 'hybrid',
    duration: 4, price: 150, maxStudents: 5, currentStudents: 1, status: 'active',
    instructor: 'Saïd Hammouda', location: 'Empresa / Remot',
    description: 'Assessorament personalitzat per a la transformació digital de la teva empresa. Solucions IT a mida.',
    objectives: `Anàlisi de la infraestructura tecnològica actual
Pla de transformació digital personalitzat
Selecció i implementació d'eines col·laboratives
Optimització de processos amb tecnologia
Formació específica per a l'equip
Seguretat informàtica i protecció de dades (GDPR)
Migració a Microsoft 365 o Google Workspace
Suport i seguiment post-implantació`,
    tags: 'consultoria,transformacio-digital,empreses,gdpr', createdAt: now - M, updatedAt: now,
  });

  // ── SOL·LICITUDS I PAGAMENTS DE DEMO ──────────────────────
  const excelCourse = await db.courses.where('name').equals('Excel Inicial').first();
  const wordCourse  = await db.courses.where('name').equals('Word Intermedi').first();

  if (excelCourse && userId) {
    const reqId = await db.requests.add({
      userId: userId as number, courseId: excelCourse.id!, status: 'pending',
      message: "M'agradaria apuntar-me al curs d'Excel. Tinc coneixements bàsics.",
      createdAt: now - 7200000, updatedAt: now - 7200000,
    });
    await db.payments.add({
      userId: userId as number, courseId: excelCourse.id!, requestId: reqId as number,
      amount: 90, status: 'pending', method: 'transfer',
      concept: "Excel Inicial - Pendent de confirmació",
      dueDate: now + W, createdAt: now - 7200000, updatedAt: now - 7200000,
    });
  }

  if (wordCourse && userId) {
    await db.requests.add({
      userId: userId as number, courseId: wordCourse.id!, status: 'approved',
      message: 'Necessito millorar amb Word per a la feina.',
      adminNotes: 'Sol·licitud aprovada. Ens posem en contacte aviat.',
      createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 2,
    });
    await db.payments.add({
      userId: userId as number, courseId: wordCourse.id!,
      amount: 110, status: 'paid', method: 'bizum',
      concept: 'Word Intermedi — Pagament complet',
      paidAt: now - 86400000 * 2, createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2,
    });
  }

  await db.payments.add({
    userId: adminId as number, courseId: undefined,
    amount: 60, status: 'paid', method: 'cash',
    concept: 'Reparació PC — Client extern',
    paidAt: now - 86400000 * 5, createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 5,
  });

  // ── NOTIFICACIONS ─────────────────────────────────────────
  await db.notifications.add({
    userId: adminId as number, type: 'info',
    title: 'Nova sol·licitud rebuda',
    message: "L'usuari 'demo' ha sol·licitat plaça al curs Excel Inicial.",
    read: false, link: '/courses', createdAt: now - 7200000,
  });
  await db.notifications.add({
    userId: adminId as number, type: 'success',
    title: 'Pagament confirmat',
    message: "S'ha rebut el pagament de 110€ per al curs Word Intermedi.",
    read: false, link: '/payments', createdAt: now - 86400000 * 2,
  });
  await db.notifications.add({
    userId: userId as number, type: 'success',
    title: 'Sol·licitud aprovada',
    message: 'La teva sol·licitud per al curs Word Intermedi ha estat aprovada.',
    read: true, link: '/courses', createdAt: now - 86400000 * 2,
  });

  // ── SETTINGS ─────────────────────────────────────────────
  await db.settings.add({ key: 'whatsapp_number', value: '34600000000' });
  await db.settings.add({ key: 'app_language', value: 'ca' });
  await db.settings.add({ key: 'app_theme', value: 'dark' });
  await db.settings.add({ key: 'app_version', value: '1.0.0' });
}

async function hashForSeed(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'shformacions_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ══════════════════════════════════════════════════════════════
// IA COURSES (added separately if seed already ran)
// ══════════════════════════════════════════════════════════════
export async function seedIACourses(): Promise<void> {
  const existing = await db.courses.where('category').equals('ia').count();
  if (existing > 0) return;
  const now = Date.now();
  const W = 86400000 * 7;
  const M = 86400000 * 30;
  const iaCourses = [
    {
      name: 'IA Inicial: Fonaments i Eines Pràctiques',
      description: 'Introducció a la Intel·ligència Artificial per a persones sense coneixements tècnics. Aprèn a usar les eines d\'IA del dia a dia per ser més productiu/iva.',
      level: 'basic' as const, format: 'hybrid' as const, duration: 8, price: 95,
      maxStudents: 12, currentStudents: 2, status: 'active' as const,
      targetAudience: 'Qualsevol professional que vulgui incorporar l\'IA a la seva feina diària, sense necessitat de coneixements tècnics previs.',
      objectives: `Entendre què és la IA, el Machine Learning i la IA generativa
Usar ChatGPT, Copilot i altres assistents de forma efectiva
Escriure prompts eficaços per obtenir millors resultats
Generar imatges i contingut amb eines d'IA
Automatitzar tasques repetitives amb IA
Ciberseguretat i ètica a l'era de la IA
Eines d'IA per a productivitat: Notion AI, Grammarly, etc.
Casos pràctics reals adaptats a la teva feina`,
      tags: 'ia,chatgpt,copilot,prompts,productivitat',
      startDate: now + W, endDate: now + W + M,
    },
    {
      name: 'IA Avançat: Automatització i Agents',
      description: 'Aprofundeix en les capacitats avançades de la IA: automatitzacions, agents autònoms, integració amb eines de negoci i casos d\'ús empresarials.',
      level: 'advanced' as const, format: 'hybrid' as const, duration: 16, price: 175,
      maxStudents: 10, currentStudents: 1, status: 'active' as const,
      targetAudience: 'Professionals amb coneixements bàsics d\'IA que volen implementar solucions avançades a la seva empresa.',
      objectives: `LLMs avançats: GPT-4o, Claude, Gemini — diferències i casos d'ús
Enginyeria de prompts avançada (cadena de pensament, RAG)
Agents d'IA autònoms: crear i configurar workflows
Make i Zapier amb IA: automatitzacions intel·ligents
Microsoft Copilot Studio: crear assistents corporatius
Integració d'IA amb bases de dades i APIs
Power Automate + IA: fluxos de treball intel·ligents
Seguretat, privacitat i governança de l'IA a l'empresa`,
      tags: 'ia,agents,automatitzacio,copilot-studio,llm',
      startDate: now + W * 2, endDate: now + W * 2 + M,
    },
    {
      name: 'IA per a Màrqueting Digital',
      description: 'Transforma la teva estratègia de màrqueting amb IA. Crea contingut, analitza dades i automatitza campanyes amb les eines més actuals.',
      level: 'intermediate' as const, format: 'online' as const, duration: 10, price: 120,
      maxStudents: 12, currentStudents: 3, status: 'active' as const,
      targetAudience: 'Professionals de màrqueting, community managers, responsables de comunicació i emprenedors.',
      objectives: `Creació de contingut amb IA: textos, imatges, vídeos curts
SEO i copywriting amb assistència d'IA
Generació d'imatges per a xarxes socials (Midjourney, DALL-E)
Anàlisi de dades de màrqueting amb IA
Automatització de publicacions i campanyes
Chatbots per a atenció al client i xarxes socials
Personalització d'emails i comunicacions massives
Eines: Jasper, Copy.ai, Canva IA, HubSpot IA`,
      tags: 'ia,marketing,contingut,seo,xarxes-socials',
      startDate: now + W * 2, endDate: now + W * 2 + M / 2,
    },
    {
      name: 'IA per a Recursos Humans',
      description: 'Incorpora la IA als processos de selecció, formació i gestió del talent. Redueix temps i millora la qualitat de les decisions de RH.',
      level: 'intermediate' as const, format: 'online' as const, duration: 8, price: 110,
      maxStudents: 12, currentStudents: 0, status: 'active' as const,
      targetAudience: 'Professionals de Recursos Humans, responsables de selecció, caps d\'equip i directors de persones.',
      objectives: `IA per a criba i filtrat de currículums
Redacció d'ofertes de feina optimitzades amb IA
Anàlisi de perfils i matching candidat-lloc
Chatbots per a onboarding i formació interna
Generació de plans de formació personalitzats
Anàlisi del clima laboral i predicció de rotació
Eines HR amb IA: Workday, BambooHR, LinkedIn Recruiter IA
Consideracions legals i ètiques en IA i RH`,
      tags: 'ia,rrhh,seleccio,talent,formacio',
      startDate: now + W * 3, endDate: now + W * 3 + M / 2,
    },
    {
      name: 'IA per a Finances i Comptabilitat',
      description: 'Automatitza i optimitza processos financers amb IA. Des de la comptabilitat quotidiana fins a l\'anàlisi predictiu i la detecció de frau.',
      level: 'intermediate' as const, format: 'hybrid' as const, duration: 10, price: 130,
      maxStudents: 10, currentStudents: 0, status: 'active' as const,
      targetAudience: 'Comptables, directors financers, controladors de gestió i analistes financers.',
      objectives: `Automatització de facturació i conciliació bancària amb IA
Anàlisi predictiu de fluxos de caixa
Detecció d'anomalies i frau amb Machine Learning
IA en Excel i Power BI per a informes financers
Chatbots per a consultes fiscals i comptables
Eines IA per a comptabilitat: QuickBooks IA, Sage IA
Previsió de vendes i modelació financera
Automatització de processos de tancament mensual`,
      tags: 'ia,finances,comptabilitat,excel,powerbi',
      startDate: now + W * 4, endDate: now + W * 4 + M / 2,
    },
    {
      name: 'IA per a Atenció al Client',
      description: 'Millora l\'experiència del client i redueix el temps de resposta amb chatbots intel·ligents, anàlisi de sentiments i automatització d\'incidències.',
      level: 'intermediate' as const, format: 'online' as const, duration: 8, price: 105,
      maxStudents: 15, currentStudents: 2, status: 'active' as const,
      targetAudience: 'Agents d\'atenció al client, supervisors de call center, responsables de CX i equips de suport tècnic.',
      objectives: `Chatbots intel·ligents amb IA per a web i WhatsApp
Configuració de Copilot per a suport tècnic
Anàlisi de sentiments en reviews i enquestes
Automatització de resposta a emails i formularis
Classificació i priorització automàtica d'incidències
Integració amb CRM (Salesforce, Zoho, HubSpot)
Personalització de la experiència del client amb IA
Mesura de satisfacció i millora contínua amb dades`,
      tags: 'ia,atencio-client,chatbot,crm,experiencia',
      startDate: now + W * 3, endDate: now + W * 3 + M / 2,
    },
    {
      name: 'IA per a Direcció i Gestió Empresarial',
      description: 'IA estratègica per a directius. Pren millors decisions amb intel·ligència de negoci augmentada, informes automàtics i anàlisi predictiu avançat.',
      level: 'advanced' as const, format: 'presential' as const, duration: 6, price: 150,
      maxStudents: 8, currentStudents: 1, status: 'active' as const,
      targetAudience: 'Directius, gerents, empresaris i responsables de presa de decisions estratègiques.',
      objectives: `IA com a avantatge competitiu: estratègia i implementació
Business Intelligence augmentat amb IA (Power BI + Copilot)
Automatització de reports executius setmanals
Anàlisi de mercat i competitors amb IA
Presa de decisions basada en dades i IA predictiva
Gestió del canvi cultural per a adoptar la IA
Riscos, regulació i governança de la IA (UE AI Act)
Casos pràctics: transformació digital real amb IA`,
      tags: 'ia,direccio,estrategia,bi,transformacio',
      startDate: now + W * 5, endDate: now + W * 5 + M / 2,
    },
  ];

  for (const course of iaCourses) {
    await db.courses.add({
      ...course,
      category: 'ia',
      instructor: 'Saïd Hammouda',
      location: course.format === 'presential' ? 'Aula 1' : course.format === 'online' ? 'Online (Zoom)' : 'Aula 1 / Online',
      createdAt: now, updatedAt: now,
    });
  }
}

// ── AI courses append helper — called from seedDatabase ──
// NOTE: These are added automatically in the main seedDatabase function below via the next export

// ── Cursos de PowerPoint ───────────────────────────────────────────
export async function seedPowerPointCourses(): Promise<void> {
  const existing = await db.courses.where('category').equals('powerpoint').count();
  if (existing > 0) return;
  const now = Date.now();
  const W = 86400000 * 7;
  const M = 86400000 * 30;

  await db.courses.add({
    name: 'PowerPoint Inicial', category: 'powerpoint', level: 'basic',
    format: 'presential', duration: 8, price: 75, maxStudents: 12, currentStudents: 2,
    status: 'active', instructor: 'Saïd Hammouda', location: 'Aula 2',
    startDate: now + W * 2, endDate: now + W * 2 + M,
    description: 'Aprèn a crear presentacions visuals atractives amb Microsoft PowerPoint des de zero. Ideal per a professionals que necessiten comunicar idees de forma clara i impactant.',
    targetAudience: `Persones sense coneixements de PowerPoint\nProfessionals que fan presentacions a feina\nEstudiants i autònoms`,
    objectives: `Conèixer la interfície de PowerPoint i els menús\nCrear una presentació nova des de zero\nAfegir i formatar text: fonts, mides i colors\nInserir imatges, formes i icones\nAplicar temes i dissenys predefinits\nAfegir transicions entre diapositives\nInserir animacions bàsiques als elements\nPresentar en pantalla completa i exportar a PDF`,
    tags: 'powerpoint,presentacions,disseny,diapositives', createdAt: now - M, updatedAt: now,
  });

  await db.courses.add({
    name: 'PowerPoint Intermedi', category: 'powerpoint', level: 'intermediate',
    format: 'hybrid', duration: 12, price: 110, maxStudents: 12, currentStudents: 1,
    status: 'active', instructor: 'Saïd Hammouda', location: 'Aula 2 / Online',
    startDate: now + W * 3, endDate: now + W * 3 + M,
    description: 'Crea presentacions professionals que destaquen. Aprèn tècniques de disseny, animacions avançades, gràfics i elements multimèdia per impressionar a qualsevol audiència.',
    targetAudience: `Usuaris amb coneixements bàsics de PowerPoint\nDirectius, comercials i formadors\nProfessionals que fan presentacions sovint`,
    objectives: `Disseny professional: composició i paletes de colors\nCrear patrón de diapositives corporatiu\nAnimacions avançades: entrada, sortida i moviment\nInserir i editar gràfics de dades dinàmics\nVídeos i àudio incrustats a la presentació\nSmartArt: diagrames i processos visuals\nSeccions i hipervincles entre diapositives\nExportar com a vídeo MP4 i presentació web`,
    tags: 'powerpoint,animacions,disseny,grafics,corporate', createdAt: now - M, updatedAt: now,
  });

  await db.courses.add({
    name: 'PowerPoint Avançat: Presentacions d\'Impacte', category: 'powerpoint', level: 'advanced',
    format: 'hybrid', duration: 10, price: 130, maxStudents: 10, currentStudents: 0,
    status: 'active', instructor: 'Saïd Hammouda', location: 'Aula 2 / Online',
    startDate: now + W * 5, endDate: now + W * 5 + M,
    description: 'Domina PowerPoint al nivell expert. Crea presentacions interactives, automatitzades i de disseny professional comparables als millors estudis de comunicació.',
    targetAudience: `Usuaris avançats de PowerPoint\nDireccions comercials i de màrqueting\nFormadors, coaches i conferenciants`,
    objectives: `Disseny "Slide Master" avançat per a marques\nMàscares, morfologia i efectes 3D\nAnimacions complexes i efectes de cinema\nPresentacions interactives amb botons i branques\nIntegrar Excel: gràfics dinàmics vinculats\nMacros bàsiques per automatitzar presentacions\nTècniques de storytelling visual\nEines de col·laboració i presentació remota (Teams)`,
    tags: 'powerpoint,avançat,storytelling,macros,3d,corporate', createdAt: now - M, updatedAt: now,
  });
}
