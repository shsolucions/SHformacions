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
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [recogLang, setRecogLang] = useState<string>('ca');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasGreeted = useRef(false);

  // Detecta mòbil en redimensionar
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // iOS: ajusta l'alçada del xat quan el teclat s'obre/tanca
  useEffect(() => {
    if (!isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      el.style.height = `${vv.height}px`;
      el.style.top = `${vv.offsetTop}px`;
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isMobile]);

  // Salutació inicial
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setLoading(true);
    setTimeout(() => {
      setMessages([{ role: 'model', text: "Hola! 👋 Soc el company virtual d'en Saïd 😊" }]);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    [messages, loading, showContactForm]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'model' || contactSaved || messages.length < 3) return;
    const text = last.text.toLowerCase();
    const triggers = [
      'dates', 'disponibilitat', 'telèfon', 'correu', 'contacte',
      'posar-me en contacte', 'enviarte', 'enviar-te', 'pressupost',
      'dades', 'informació addicional'
    ];
    if (triggers.some(t => text.includes(t))) {
      setTimeout(() => setShowContactForm(true), 800);
    }
  }, [messages, contactSaved]);

  const VOICE_PREFS: Record<string, string[]> = {
    ca: ['ca-ES', 'ca_ES', 'ca', 'es-ES', 'es'],
    es: ['es-ES', 'es_ES', 'es', 'ca-ES'],
    en: ['en-GB', 'en-US', 'en'],
    fr: ['fr-FR', 'fr_FR', 'fr'],
  };

  const getVoices = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise(resolve => {
      const v = window.speechSynthesis?.getVoices() ?? [];
      if (v.length > 0) { resolve(v); return; }
      const handler = () => { resolve(window.speechSynthesis.getVoices()); };
      window.speechSynthesis?.addEventListener('voiceschanged', handler, { once: true });
      setTimeout(() => resolve(window.speechSynthesis?.getVoices() ?? []), 1000);
    });

  const detectLang = (text: string): string => {
    const t = text.toLowerCase();
    if (/\b(bonjour|merci|oui|non|vous|je|est|les|des)\b/.test(t)) return 'fr';
    if (/\b(hello|thank|please|yes|no|course|want|need)\b/.test(t)) return 'en';
    if (/\b(hola|gracias|sí|no|quiero|puedo|tiene|precio)\b/.test(t)) return 'es';
    return 'ca';
  };

  const speak = async (text: string) => {
    if (!voiceEnabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const clean = text
      .replace(/[*#_`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;
    const lang = detectLang(clean);
    const prefs = VOICE_PREFS[lang] ?? ['ca-ES'];
    const voices = await getVoices();
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
    utter.rate = lang === 'ca' ? 0.92 : 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setTimeout(() => synth.speak(utter), 50);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSR = (): any => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const RECOG_LANGS: Record<string, string> = {
    ca: 'ca-ES', es: 'es-ES', en: 'en-GB', fr: 'fr-FR',
  };

  const startRecording = () => {
    const SR = getSR();
    if (!SR) {
      alert('Per usar el micròfon necessites Safari iOS 14.5+ o Chrome. Comprova els permisos del micròfon a Configuració.');
      return;
    }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const geminiHistory = [...messages].filter(m => m.role === 'user' || m.role === 'model');
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }
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

  const handleClose = (e: React.MouseEvent) => {
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
  };

  return (
    <div ref={containerRef}
      className="fixed z-[60] flex flex-col shadow-2xl overflow-hidden"
      style={isMobile
        ? {
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            borderRadius: 0,
            backgroundColor: 'var(--bg-card)',
          }
        : {
            bottom: 88, right: 16,
            width: 'min(380px, calc(100vw - 24px))',
            height: isMinimized ? 56 : 'min(530px, calc(100svh - 110px))',
            borderRadius: 20,
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--bg-card)',
            transition: 'height 0.3s',
          }}>

      {/* Espai safe area per al notch d'iOS (només mòbil) */}
      {isMobile && (
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
          height: 'env(safe-area-inset-top, 0px)',
          flexShrink: 0,
        }} />
      )}

      {/* ── Capçalera ────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
          height: isMobile ? 64 : 56,
          cursor: isMobile ? 'default' : 'pointer',
        }}
        onClick={() => { if (!isMobile) setIsMinimized(v => !v); }}>

        {/* Icona de perfil — visible i gran */}
        <RobotAvatar size={isMobile ? 42 : 34} />

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold leading-none" style={{ fontSize: isMobile ? 16 : 14 }}>
            Assistent Virtual
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <p className="text-white/70 text-[10px]">SHformacions · En línia</p>
          </div>
        </div>

        {/* Botó minimitzar — àrea tàctil 44×44 px */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isMobile) { onClose(); } else { setIsMinimized(v => !v); }
          }}
          className="flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white/80 flex-shrink-0"
          style={{ width: 44, height: 44 }}
          aria-label={isMinimized ? 'Expandir' : 'Minimitzar'}>
          <ChevronDown size={20} className={`transition-transform ${!isMobile && isMinimized ? 'rotate-180' : ''}`} />
        </button>

        {/* Botó tancar — àrea tàctil 44×44 px */}
        <button
          aria-label="Tancar"
          onClick={handleClose}
          className="flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors text-white flex-shrink-0"
          style={{ width: 44, height: 44 }}>
          <X size={20} />
        </button>
      </div>

      {(!isMinimized || isMobile) && (
        <>
          {/* ── Zona de missatges ───────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3"
            style={{ WebkitOverflowScrolling: 'touch' }}>
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

          {/* ── Barra d'entrada ─────────────────────────────────── */}
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

            <div className="flex items-center gap-2 px-3 pr-4 py-2.5">
              {/* Botó micròfon */}
              {hasSpeechSupport && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                  title={isRecording ? 'Atura gravació' : 'Gravar veu'}
                  className={[
                    'flex items-center justify-center rounded-xl transition-all flex-shrink-0 active:scale-90',
                    isRecording ? 'bg-red-500 animate-pulse' : 'border hover:bg-accent-500/10',
                  ].join(' ')}
                  style={{
                    width: 44, height: 44, minWidth: 44,
                    ...(isRecording ? {} : { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }),
                  }}>
                  {isRecording ? <MicOff size={18} className="text-white" /> : <Mic size={18} />}
                </button>
              )}

              {/* Botó altaveu */}
              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (!next) { window.speechSynthesis?.cancel(); setIsSpeaking(false); }
                }}
                title={voiceEnabled ? 'Desactivar veu del bot' : 'Activar veu del bot'}
                className={[
                  'flex items-center justify-center rounded-xl transition-all flex-shrink-0 border active:scale-90',
                  voiceEnabled ? 'bg-accent-500/20 border-accent-500' : '',
                  isSpeaking ? 'animate-pulse' : '',
                ].join(' ')}
                style={{
                  width: 44, height: 44, minWidth: 44,
                  ...(!voiceEnabled ? { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' } : {}),
                }}>
                <Volume2 size={18} className={voiceEnabled ? 'text-accent-500' : ''} />
              </button>

              {/* Camp de text */}
              <input ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isRecording ? '🎙️ Escoltant...' : 'Escriu un missatge...'}
                className="flex-1 h-11 px-3 rounded-xl border outline-none focus:border-accent-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-input)',
                  fontSize: '16px',
                }}
                disabled={loading} />

              {/* Botó enviar */}
              <button onClick={handleSend} disabled={!input.trim() || loading}
                className="flex items-center justify-center rounded-xl bg-accent-500 hover:bg-accent-600 active:scale-90 disabled:opacity-40 transition-all flex-shrink-0"
                style={{ width: 44, height: 44, minWidth: 44 }}>
                {loading
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : <Send size={18} className="text-white" />}
              </button>
            </div>

            {/* Espai safe area per a la barra d'inici d'iOS */}
            {isMobile && (
              <div style={{
                height: 'env(safe-area-inset-bottom, 0px)',
                backgroundColor: 'var(--bg-card)',
                flexShrink: 0,
              }} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
