import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Phone, Mail, Save, ChevronDown, Mic, MicOff, Volume2 } from 'lucide-react';
import { sendMessage, saveConversationToSheet, type ChatMessage } from '../../services/geminiService';

interface ChatBotProps { onClose: () => void; }

function RobotAvatar({ size = 28 }: { size?: number }) {
  return (
    <img src="/SHbot.png" alt="Assistent"
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-bl-sm"
      style={{ backgroundColor: 'var(--bg-elevated)', display: 'inline-flex' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === 'model';
  const lines = msg.text.split('\n');
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-end justify-end'}`}>
      {isBot && <RobotAvatar size={28} />}
      <div
        className={['max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
          isBot ? 'rounded-tl-sm' : 'rounded-br-sm text-white'].join(' ')}
        style={isBot
          ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }
          : { backgroundColor: '#0ea5e9' }}>
        {lines.map((line, i) => (
          line === '' ? <div key={i} className="h-1.5" /> : <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function ContactForm({ onSave, onSkip }: {
  onSave: (phone: string, email: string) => void; onSkip: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  return (
    <div className="rounded-2xl border p-4 mx-1 my-2 animate-slide-up"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
      <p className="text-xs font-semibold text-accent-500 mb-3">
        💾 Deixa les teves dades i en Saïd es posarà en contacte
      </p>
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="tel" placeholder="Telèfon (WhatsApp)" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', fontSize: '16px' }} />
        </div>
        <div className="relative">
          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" placeholder="Correu electrònic" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', fontSize: '16px' }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(phone, email)} disabled={!phone && !email}
            className="flex-1 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors">
            <Save size={13} /> Enviar dades
          </button>
          <button onClick={onSkip} className="px-3 h-9 rounded-xl border text-xs transition-colors"
            style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>
            Ara no
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tipus SpeechRecognition (API del navegador) ──────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [awaitingName, setAwaitingName] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreeted = useRef(false);

  // Salutació inicial — enviem una instrucció clara per disparar la salutació
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setLoading(true);
    // Salutació inicial simple — no cal cridar Gemini, és sempre igual
    setTimeout(() => {
      setMessages([{ role: 'model', text: "Hola! 👋 Soc el company virtual d'en Saïd 😊" }]);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    [messages, loading, showContactForm]);

  // Detectar si cal mostrar el formulari de contacte
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'model' || contactSaved || messages.length < 3) return;
    const text = last.text.toLowerCase();
    // Mostrem el formulari quan el bot menciona dates, contacte, telèfon o correu
    const triggers = [
      'dates', 'disponibilitat', 'telèfon', 'correu', 'contacte',
      'posar-me en contacte', 'enviarte', 'enviar-te', 'pressupost',
      'dades', 'informació addicional'
    ];
    if (triggers.some(t => text.includes(t))) {
      setTimeout(() => setShowContactForm(true), 800);
    }
  }, [messages, contactSaved]);

  // ── Detectar idioma actual de l'app per TTS ─────────────────────────────────
  // Prioritats de veu per idioma (codi IETF)
  const VOICE_PREFS: Record<string, string[]> = {
    ca: ['ca-ES', 'ca_ES', 'ca', 'es-ES', 'es'],
    es: ['es-ES', 'es_ES', 'es', 'ca-ES'],
    en: ['en-GB', 'en-US', 'en'],
    fr: ['fr-FR', 'fr_FR', 'fr'],
  };

  // Obtenim la llista de veus (Safari les carrega async)
  const getVoices = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise(resolve => {
      const v = window.speechSynthesis?.getVoices() ?? [];
      if (v.length > 0) { resolve(v); return; }
      // Safari carrega les veus de manera asíncrona
      const handler = () => { resolve(window.speechSynthesis.getVoices()); };
      window.speechSynthesis?.addEventListener('voiceschanged', handler, { once: true });
      // Timeout de seguretat per si no dispara l'event
      setTimeout(() => resolve(window.speechSynthesis?.getVoices() ?? []), 1000);
    });

  // Detecta l'idioma del text per triar la veu correcta
  const detectLang = (text: string): string => {
    const t = text.toLowerCase();
    if (/\b(bonjour|merci|oui|non|vous|je|est|les|des)\b/.test(t)) return 'fr';
    if (/\b(hello|thank|please|yes|no|course|want|need)\b/.test(t)) return 'en';
    if (/\b(hola|gracias|sí|no|quiero|puedo|tiene|precio)\b/.test(t)) return 'es';
    return 'ca'; // Català per defecte
  };

  const speak = async (text: string) => {
    if (!voiceEnabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();

    // Netegem el text: eliminem Markdown i caràcters no parlables
    const clean = text
      .replace(/[*#_`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')   // eliminem URLs
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;

    const lang = detectLang(clean);
    const prefs = VOICE_PREFS[lang] ?? ['ca-ES'];
    const voices = await getVoices();

    // Triem la millor veu disponible
    let chosen: SpeechSynthesisVoice | null = null;
    for (const pref of prefs) {
      chosen = voices.find(v =>
        v.lang === pref || v.lang.startsWith(pref.split('-')[0])
      ) ?? null;
      if (chosen) break;
    }

    const utter = new SpeechSynthesisUtterance(clean);
    if (chosen) utter.voice = chosen;
    utter.lang = chosen?.lang ?? prefs[0];
    utter.rate = lang === 'ca' ? 0.92 : 0.95; // Català una mica més lent per claredat
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    // Safari iOS: cal petita pausa per evitar que es talli la veu
    setTimeout(() => synth.speak(utter), 50);
  };

  // ── Micròfon: reconeixement de veu (compatible Safari/Chrome) ─────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSR = (): any => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const RECOG_LANGS: Record<string, string> = {
    ca: 'ca-ES', es: 'es-ES', en: 'en-GB', fr: 'fr-FR',
  };
  const [recogLang, setRecogLang] = useState<string>('ca');

  const startRecording = () => {
    const SR = getSR();
    if (!SR) {
      // Safari iOS no suporta WebSpeech - missatge amigable
      alert('Per usar el micròfon necessites Safari iOS 14.5+ o Chrome. Comprova els permisos del micròfon a Configuració.');
      return;
    }
    // Aturem qualsevol reconeixement anterior
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignorem */ }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    recognitionRef.current = rec;
    rec.lang = RECOG_LANGS[recogLang] ?? 'ca-ES';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript: string = e.results?.[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) setInput(prev => prev ? prev + ' ' + transcript : transcript);
      setIsRecording(false);
    };
    rec.onerror = (e: any) => {
      console.warn('SpeechRecognition error:', e.error);
      if (e.error === 'not-allowed') {
        alert('Micròfon no autoritzat. Ves a Configuració > Safari > Micròfon i activa el permís.');
      }
      setIsRecording(false);
    };
    rec.onend = () => setIsRecording(false);

    try {
      rec.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('No s\'ha pogut iniciar el micròfon:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignorem */ }
    }
    setIsRecording(false);
  };

  const hasSpeechSupport = !!getSR();

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setShowContactForm(false);
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      // Construïm l'historial per Gemini
      // Si és el PRIMER missatge de l'usuari, afegim context que Gemini ja ha saludat
      const geminiHistory = [...messages].filter(m => m.role === 'user' || m.role === 'model');
      // Traiem els missatges 'model' del principi (generats localment)
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }
      // Si és el primer missatge (historial buit), diem a Gemini que ja ha saludat
      // i que OBLIGATÒRIAMENT ha de demanar el nom abans de res
      const isFirstMessage = geminiHistory.length === 0;
      const textToSend = isFirstMessage
        ? `[CONTEXT: Ja has saludat amb "Hola! Soc el company virtual d'en Saïd". L'usuari acaba d'escriure el seu primer missatge. OBLIGATORI: respon demanant el nom de l'usuari. No presentes opcions ni categories. Només demana el nom.]

Missatge de l'usuari: ${text}`
        : text;
      const reply = await sendMessage(geminiHistory, textToSend);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
      speak(reply);
    } catch (err) {
      console.error('Error enviament:', err);
      setMessages((prev) => [...prev, {
        role: 'model',
        text: 'Ho sento, ha hagut un problema tècnic. Torna-ho a provar en uns moments 🙏',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  const handleSaveContact = async (phone: string, email: string) => {
    setShowContactForm(false);
    setContactSaved(true);
    const fullChat = messages.map((m) => `${m.role === 'user' ? (userName || 'Client') : 'Assistent'}: ${m.text}`).join('\n---\n');
    const userText = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ').toLowerCase();
    const keywords = ['excel', 'word', 'powerpoint', 'access', 'outlook', 'actic', 'ia ', 'cloud', 'microsoft', 'consultoria'];
    const coursesFound = keywords.filter((k) => userText.includes(k)).join(', ') || 'No especificats';
    await saveConversationToSheet({
      phone: phone || '—',
      email: email || '—',
      summary: `Nom: ${userName || 'desconegut'}. ${userText.slice(0, 300)}`,
      courses: coursesFound,
      fullChat,
    });
    setMessages((prev) => [...prev, {
      role: 'model',
      text: `Perfecte, ${userName ? userName + '!' : ''} ✅ He guardat les teves dades.\n\nEn Saïd es posarà en contacte amb tu molt aviat per confirmar disponibilitat i dates 😊\n\nGràcies per confiar en SHformacions!`,
    }]);
  };

  return (
    <div className="fixed z-[60] flex flex-col shadow-2xl border overflow-hidden transition-all duration-300"
      style={{
        bottom: 88, right: 16,
        width: 'min(360px, calc(100vw - 32px))',
        height: isMinimized ? 52 : 'min(520px, calc(100vh - 120px))',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-strong)',
        borderRadius: 20,
      }}>

      {/* Capçalera */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] flex-shrink-0 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
        onClick={() => setIsMinimized(!isMinimized)}>
        <RobotAvatar size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-none">Assistent Virtual</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-white/70 text-[10px]">SHformacions · En línia</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80">
          <ChevronDown size={16} className={`transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={(e) => {
            e.stopPropagation();
            const userMessages = messages.filter(m => m.role === 'user');
            const hasRealContent = userMessages.length >= 2 && userMessages.map(m => m.text).join(' ').length > 15;

            if (hasRealContent && !contactSaved) {
              const fullChat = messages.map((m) =>
                `${m.role === 'user' ? (userName || 'Client') : 'Assistent'}: ${m.text}`
              ).join('\n');
              const userText = userMessages.map(m => m.text).join(' ').toLowerCase();
              const keywords = ['excel','word','powerpoint','access','outlook','actic','ia','cloud','microsoft','consultoria'];
              const coursesFound = keywords.filter(k => userText.includes(k)).join(', ') || 'No especificats';

              // Demanem a Gemini un resum real de la conversa
              fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  system_instruction: { parts: [{ text: "Analitza la conversa i escriu UN RESUM de maxim 2 frases. Format: [Nom client] interessat en [curs/tema] per a [N persones]. [Si ha deixat contacte: Ha deixat el telefon/correu]. Si no se sap el nom posa 'Client'. Exemple: Maria interessada en Word Inicial per a 10 persones empresa. Ha deixat el correu maria@empresa.cat. IMPORTANT: nomes el resum, sense cap altra cosa." }] },
                  contents: [{ role: 'user', parts: [{ text: `CONVERSA:\n${fullChat}\n\nESCRIU EL RESUM:` }] }]
                })
              }).then(r => r.json()).then(d => {
                const resum = d.text || `${userName || 'Desconegut'}: ${userText.slice(0, 200)}`;
                saveConversationToSheet({ phone: '—', email: '—', summary: resum, courses: coursesFound, fullChat });
              }).catch(() => {
                saveConversationToSheet({ phone: '—', email: '—', summary: `${userName || 'Desconegut'}: ${userText.slice(0, 200)}`, courses: coursesFound, fullChat });
              });
            }
            onClose();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white">
          <X size={15} />
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Missatges */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-2 items-start">
                <RobotAvatar size={28} />
                <TypingDots />
              </div>
            )}
            {showContactForm && !contactSaved && (
              <ContactForm onSave={handleSaveContact} onSkip={() => setShowContactForm(false)} />
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input + controls de veu */}
          <div className="flex flex-col border-t flex-shrink-0" style={{ borderColor: 'var(--border-base)' }}>

            {/* Selector d'idioma quan el micròfon és actiu */}
            {isRecording && (
              <div className="flex items-center gap-1.5 px-3 pt-2">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Idioma:</span>
                {(['ca','es','en','fr'] as const).map(lang => (
                  <button key={lang}
                    onClick={() => setRecogLang(lang)}
                    className={[
                      'px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors',
                      recogLang === lang ? 'bg-accent-500 text-white' : 'border',
                    ].join(' ')}
                    style={recogLang !== lang ? { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' } : {}}>
                    {lang === 'ca' ? '🇪🇸 CAT' : lang === 'es' ? '🇪🇸 ESP' : lang === 'en' ? '🇬🇧 ENG' : '🇫🇷 FRA'}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-2.5">
              {/* Botó micròfon — ocult si el navegador no el suporta */}
              {hasSpeechSupport && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                  title={isRecording ? 'Atura gravació' : 'Gravar veu'}
                  className={[
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                    isRecording ? 'bg-red-500 animate-pulse' : 'border hover:bg-accent-500/10',
                  ].join(' ')}
                  style={isRecording ? {} : { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}>
                  {isRecording
                    ? <MicOff size={15} className="text-white" />
                    : <Mic size={15} />}
                </button>
              )}

              <input ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isRecording ? '🎙️ Escoltant...' : 'Escriu o grava un missatge...'}
                className="flex-1 h-9 px-3 rounded-xl border outline-none focus:border-accent-500 transition-colors"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', fontSize: '16px' }}
                disabled={loading} />

              {/* Toggle resposta de veu */}
              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (!next) { window.speechSynthesis?.cancel(); setIsSpeaking(false); }
                }}
                title={voiceEnabled ? 'Desactivar veu del bot' : 'Activar veu del bot'}
                className={[
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border',
                  voiceEnabled ? 'bg-accent-500/20 border-accent-500' : '',
                  isSpeaking ? 'animate-pulse' : '',
                ].join(' ')}
                style={!voiceEnabled ? { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' } : {}}>
                <Volume2 size={15} className={voiceEnabled ? 'text-accent-500' : ''} />
              </button>

              {/* Enviar */}
              <button onClick={handleSend} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                {loading
                  ? <Loader2 size={15} className="text-white animate-spin" />
                  : <Send size={15} className="text-white" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
