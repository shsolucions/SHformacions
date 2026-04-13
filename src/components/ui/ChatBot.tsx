import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Phone, Mail, Save, ChevronDown, Mic, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { sendMessage, saveConversationToSheet, type ChatMessage } from '../../services/geminiService';

interface ChatBotProps { onClose: () => void; }

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

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

function VoiceWave({ color = '#0ea5e9', size = 16 }: { color?: string; size?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
        <span key={i} style={{
          display: 'inline-block',
          width: size * 0.18,
          height: size * h,
          backgroundColor: color,
          borderRadius: 99,
          animation: 'voiceWave 0.8s ease-in-out infinite',
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}
      <style>{`@keyframes voiceWave { 0%,100%{transform:scaleY(0.4);opacity:0.6} 50%{transform:scaleY(1);opacity:1} }`}</style>
    </div>
  );
}

interface MessageProps { msg: ChatMessage; isVoice?: boolean; onPlay?: () => void; isPlaying?: boolean; }
function Message({ msg, isVoice, onPlay, isPlaying }: MessageProps) {
  const isBot = msg.role === 'model';
  const lines = msg.text.split('\n');
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-end justify-end'}`}>
      {isBot && <RobotAvatar size={28} />}
      <div className={['max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
        isBot ? 'rounded-tl-sm' : 'rounded-br-sm text-white'].join(' ')}
        style={isBot
          ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }
          : { backgroundColor: '#0ea5e9' }}>
        {isVoice && !isBot && (
          <div className="flex items-center gap-1.5 mb-1 opacity-80">
            <Mic size={11} /><span style={{ fontSize: 10 }}>Nota de veu</span>
          </div>
        )}
        {lines.map((line, i) => line === '' ? <div key={i} className="h-1.5" /> : <p key={i}>{line}</p>)}
        {isBot && onPlay && (
          <button onClick={onPlay}
            className="mt-2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
            style={{ fontSize: 10 }}>
            {isPlaying
              ? <><VoiceWave color="currentColor" size={13} /><span>Parlant...</span></>
              : <><Volume2 size={12} /><span>Escoltar resposta</span></>}
          </button>
        )}
      </div>
    </div>
  );
}

function ContactForm({ onSave, onSkip }: { onSave: (p: string, e: string) => void; onSkip: () => void }) {
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState('');
  return (
    <div className="rounded-2xl border p-4 mx-1 my-2"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
      <p className="text-xs font-semibold text-accent-500 mb-3">💾 Deixa les teves dades i en Saïd es posarà en contacte</p>
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="tel" placeholder="Telèfon (WhatsApp)" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', fontSize: '16px' }} />
        </div>
        <div className="relative">
          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" placeholder="Correu electrònic" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border outline-none focus:border-accent-500"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)', fontSize: '16px' }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(phone, email)} disabled={!phone && !email}
            className="flex-1 h-9 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors">
            <Save size={13} /> Enviar dades
          </button>
          <button onClick={onSkip} className="px-3 h-9 rounded-xl border text-xs transition-colors"
            style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>Ara no</button>
        </div>
      </div>
    </div>
  );
}

// ── TTS ──────────────────────────────────────────────────────────────────────
const VOICE_PREFS: Record<string, string[]> = {
  ca: ['ca-ES','ca_ES','ca','es-ES','es'],
  es: ['es-ES','es_ES','es','ca-ES'],
  en: ['en-GB','en-US','en'],
  fr: ['fr-FR','fr_FR','fr'],
};

function detectLang(text: string): string {
  const t = text.toLowerCase();
  if (/\b(bonjour|merci|oui|non|vous|je|est)\b/.test(t)) return 'fr';
  if (/\b(hello|thank|please|yes|no|want|need)\b/.test(t)) return 'en';
  if (/\b(hola|gracias|sí|quiero|puedo|tiene|precio|buenos|necesito)\b/.test(t)) return 'es';
  return 'ca';
}

async function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const v = window.speechSynthesis?.getVoices() ?? [];
    if (v.length > 0) { resolve(v); return; }
    window.speechSynthesis?.addEventListener('voiceschanged', () => resolve(window.speechSynthesis.getVoices()), { once: true });
    setTimeout(() => resolve(window.speechSynthesis?.getVoices() ?? []), 1200);
  });
}

async function speakText(text: string, onStart: () => void, onEnd: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const clean = text.replace(/[*#_`~]/g,'').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
  if (!clean) return;
  const lang = detectLang(clean);
  const voices = await getVoices();
  let chosen: SpeechSynthesisVoice | null = null;
  for (const pref of (VOICE_PREFS[lang] ?? ['ca-ES'])) {
    chosen = voices.find(v => v.lang === pref || v.lang.startsWith(pref.split('-')[0])) ?? null;
    if (chosen) break;
  }
  const utter = new SpeechSynthesisUtterance(clean);
  if (chosen) utter.voice = chosen;
  utter.lang = chosen?.lang ?? 'ca-ES';
  utter.rate = 0.93; utter.pitch = 1.0; utter.volume = 1.0;
  utter.onstart = onStart; utter.onend = onEnd; utter.onerror = onEnd;
  setTimeout(() => synth.speak(utter), 50);
}

// ── Component principal ──────────────────────────────────────────────────────
export function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceIdxs, setVoiceIdxs] = useState<Set<number>>(new Set());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userName, setUserName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [autoVoice, setAutoVoice] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreeted = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setTimeout(() => setMessages([{ role: 'model', text: "Hola! 👋 Soc el company virtual d'en Saïd 😊" }]), 600);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, showContactForm]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'model' || contactSaved || messages.length < 3) return;
    const triggers = ['dates','disponibilitat','telèfon','correu','contacte','posar-me en contacte','pressupost','dades'];
    if (triggers.some(t => last.text.toLowerCase().includes(t))) setTimeout(() => setShowContactForm(true), 800);
  }, [messages, contactSaved]);

  const playMessage = useCallback(async (idx: number, text: string) => {
    if (playingIdx === idx) { window.speechSynthesis?.cancel(); setPlayingIdx(null); return; }
    window.speechSynthesis?.cancel();
    setPlayingIdx(idx);
    await speakText(text, () => setPlayingIdx(idx), () => setPlayingIdx(null));
  }, [playingIdx]);

  const sendMsg = useCallback(async (text: string, isVoice = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');
    setShowContactForm(false);
    const currentMsgs = messagesRef.current;
    const msgIdx = currentMsgs.length;
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    if (isVoice) setVoiceIdxs(prev => new Set(prev).add(msgIdx));
    setLoading(true);
    try {
      const history = [...currentMsgs].filter(m => m.role === 'user' || m.role === 'model');
      while (history.length > 0 && history[0].role === 'model') history.shift();
      const isFirst = history.length === 0;
      const getLang = (t: string) => {
        const l = t.toLowerCase();
        if (/\b(bonjour|merci|oui|vous)\b/.test(l)) return 'francès';
        if (/\b(hello|thank|please|yes)\b/.test(l)) return 'anglès';
        if (/\b(hola|gracias|sí|quiero|puedo|precio|buenos|necesito)\b/.test(l)) return 'castellà';
        return 'català';
      };
      const textToSend = isFirst
        ? `[CONTEXT: Ja has saludat. L'usuari ha escrit el seu primer missatge EN ${getLang(trimmed).toUpperCase()}. OBLIGATORI: respon SEMPRE en ${getLang(trimmed)}. Demana el nom. No presentes opcions.]\n\nMissatge: ${trimmed}`
        : trimmed;
      const reply = await sendMessage(history, textToSend);
      const botIdx = msgIdx + 1;
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
      if (isVoice || autoVoice) {
        setTimeout(async () => {
          setPlayingIdx(botIdx);
          await speakText(reply, () => setPlayingIdx(botIdx), () => setPlayingIdx(null));
        }, 400);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Ho sento, ha hagut un problema tècnic. Torna-ho a provar 🙏' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, autoVoice]);

  const getSR = () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startRecording = useCallback(() => {
    const SR = getSR();
    if (!SR) { alert('El teu navegador no suporta reconeixement de veu. Prova Chrome o Safari 14.5+'); return; }
    if (recRef.current) { try { recRef.current.abort(); } catch { /**/ } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    recRef.current = rec;
    rec.lang = 'ca-ES'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t: string = e.results?.[0]?.[0]?.transcript ?? '';
      stopRecording();
      if (t.trim()) sendMsg(t, true);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') alert('Micròfon no autoritzat. Activa els permisos al navegador.');
      stopRecording();
    };
    rec.onend = stopRecording;
    try {
      rec.start();
      setIsRecording(true); setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch { setIsRecording(false); }
  }, [sendMsg]);

  const stopRecording = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch { /**/ } recRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false); setRecordSecs(0);
  }, []);

  const hasSR = !!getSR();
  const hasTTS = typeof window !== 'undefined' && !!window.speechSynthesis;
  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleSaveContact = async (phone: string, email: string) => {
    setShowContactForm(false); setContactSaved(true);
    const fullChat = messages.map(m => `${m.role==='user'?(userName||'Client'):'Assistent'}: ${m.text}`).join('\n---\n');
    const userText = messages.filter(m => m.role==='user').map(m => m.text).join(' ').toLowerCase();
    const kw = ['excel','word','powerpoint','access','outlook','actic','ia ','cloud','microsoft','consultoria'];
    await saveConversationToSheet({ phone: phone||'—', email: email||'—',
      summary: `Nom: ${userName||'desconegut'}. ${userText.slice(0,300)}`,
      courses: kw.filter(k=>userText.includes(k)).join(', ')||'No especificats', fullChat });
    setMessages(prev => [...prev, { role: 'model',
      text: `Perfecte, ${userName?userName+'!':''} ✅ He guardat les teves dades.\n\nEn Saïd es posarà en contacte molt aviat 😊\n\nGràcies per confiar en SHformacions!` }]);
  };

  return (
    <div className="fixed z-[60] flex flex-col shadow-2xl border overflow-hidden transition-all duration-300"
      style={{ bottom: 88, right: 16, width: 'min(360px, calc(100vw - 32px))',
        height: isMinimized ? 52 : 'min(540px, calc(100vh - 120px))',
        backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)', borderRadius: 20 }}>

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
        {hasTTS && (
          <button onClick={e => { e.stopPropagation(); const n=!autoVoice; setAutoVoice(n); if(!n){window.speechSynthesis?.cancel();setPlayingIdx(null);} }}
            title={autoVoice ? 'Desactivar veu automàtica' : 'Activar veu automàtica'}
            className={['w-7 h-7 flex items-center justify-center rounded-full transition-colors', autoVoice?'bg-white/30':'hover:bg-white/10'].join(' ')}>
            {autoVoice ? <Volume2 size={14} className="text-white" /> : <VolumeX size={14} className="text-white/60" />}
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80">
          <ChevronDown size={16} className={`transition-transform ${isMinimized?'rotate-180':''}`} />
        </button>
        <button onClick={e => {
          e.stopPropagation(); window.speechSynthesis?.cancel();
          const um = messages.filter(m=>m.role==='user');
          if (um.length>=2 && !contactSaved) {
            const fullChat = messages.map(m=>`${m.role==='user'?(userName||'Client'):'Assistent'}: ${m.text}`).join('\n');
            const ut = um.map(m=>m.text).join(' ').toLowerCase();
            const kw=['excel','word','powerpoint','access','outlook','actic','ia','cloud','microsoft','consultoria'];

            // ── Filtre qualitat: només guardem si hi ha interès real ─────────
            const greetingOnly = /^[\s,.]*(hola|bon dia|bona tarde?|buenas?|buenos días|hi|hello|hey|ok+|gràcies|gracias|thanks|adeu|adéu|adiós|bye|fins aviat|de res|no res|molt bé|molt be|perfecte)[!\s,.]*$/i;
            const meaningful = um.filter(m => m.text.trim().length > 15 && !greetingOnly.test(m.text.trim()));
            const interestKw = ['curs','curso','course','formació','formacion','preu','precio','price',
              'pressupost','presupuesto','empresa','aprendre','aprender','necesit','necesito',
              'vull','quiero','quan','cuando','com','cómo','microsoft','excel','word','powerpoint',
              'access','outlook','actic','ia','cloud','persones','personas','grup','grupo',
              'hores','horas','dates','fechas','disponible','alumne','alumno'];
            const hasInterest = interestKw.some(k => ut.includes(k));
            const worthSaving = meaningful.length >= 1 && hasInterest;

            if (worthSaving) {
              fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({system_instruction:{parts:[{text:'Escriu UN RESUM de max 2 frases. Només el resum.'}]},
                  contents:[{role:'user',parts:[{text:`CONVERSA:\n${fullChat}\n\nRESUM:`}]}]})
              }).then(r=>r.json()).then(d=>saveConversationToSheet({phone:'—',email:'—',summary:d.text||`${userName||'Desconegut'}: ${ut.slice(0,200)}`,courses:kw.filter(k=>ut.includes(k)).join(',')||'No especificats',fullChat}))
                .catch(()=>saveConversationToSheet({phone:'—',email:'—',summary:`${userName||'Desconegut'}: ${ut.slice(0,200)}`,courses:'No especificats',fullChat}));
            } else {
              console.log('💬 Conversa descartada: sense contingut rellevant');
            }
          }
          onClose();
        }} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white">
          <X size={15} />
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} isVoice={voiceIdxs.has(i)}
                onPlay={msg.role==='model' ? ()=>playMessage(i, msg.text) : undefined}
                isPlaying={playingIdx===i} />
            ))}
            {loading && <div className="flex gap-2 items-start"><RobotAvatar size={28} /><TypingDots /></div>}
            {showContactForm && !contactSaved && <ContactForm onSave={handleSaveContact} onSkip={()=>setShowContactForm(false)} />}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-col border-t flex-shrink-0" style={{ borderColor: 'var(--border-base)' }}>
            {/* Banner gravació */}
            {isRecording && (
              <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: '#fef2f2' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <VoiceWave color="#ef4444" size={20} />
                  <span className="text-xs font-bold text-red-600">{fmt(recordSecs)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-red-500">Gravant... parla ara</span>
                  <button onClick={stopRecording}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white font-semibold" style={{ fontSize: 10 }}>
                    <StopCircle size={11} /> Atura
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-2.5">
              {hasSR && (
                <button
                  onMouseDown={startRecording}
                  onTouchStart={e => { e.preventDefault(); startRecording(); }}
                  onClick={isRecording ? stopRecording : undefined}
                  disabled={loading}
                  title={isRecording ? 'Atura' : 'Nota de veu'}
                  className={['w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                    isRecording ? 'bg-red-500 shadow-lg scale-110' : 'border hover:bg-accent-500/10'].join(' ')}
                  style={isRecording ? {} : { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}>
                  {isRecording ? <VoiceWave color="white" size={18} /> : <Mic size={16} />}
                </button>
              )}
              <input ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMsg(input); } }}
                placeholder={isRecording ? '🎙️ Escoltant...' : 'Escriu un missatge...'}
                className="flex-1 h-10 px-3 rounded-xl border outline-none focus:border-accent-500 transition-colors"
                style={{ backgroundColor:'var(--bg-input)', color:'var(--text-primary)', borderColor:'var(--border-input)', fontSize:'16px' }}
                disabled={loading || isRecording} />
              <button onClick={() => sendMsg(input)} disabled={!input.trim()||loading||isRecording}
                className="w-10 h-10 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                {loading ? <Loader2 size={15} className="text-white animate-spin" /> : <Send size={15} className="text-white" />}
              </button>
            </div>

            {hasSR && !isRecording && (
              <p className="text-center pb-1.5" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                🎙️ Toca el micro per nota de veu · {autoVoice ? '🔊 Resposta en veu ON' : '🔇 Toca 🔊 a dalt per activar veu'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
